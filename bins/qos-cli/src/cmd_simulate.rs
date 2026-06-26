//! `qos simulate mesh` — spawn N isolated Q-OS nodes in-process,
//! wire them into a closed libp2p mesh, and provide an interactive
//! REPL for firing execution triggers while watching live CRDT propagation.

use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use anyhow::{Context, Result};
use clap::Subcommand;
use libp2p::{identity, Multiaddr, Swarm, PeerId};
use owo_colors::OwoColorize;
use tokio::sync::{broadcast, oneshot, Mutex};
use tracing::info;

use qos_bootloader::pipeline::{BootloaderConfig, BootloaderPipeline};
use qos_engine::engine::{EngineConfig, ExecutionEngine};
use qos_engine::event_bus::EventBus;
use qos_policy::{PolicyEngine, UriAllowList};
use qos_state::SledStateStore;
use qos_state_sync::{engine::StateSyncEngine, network::QosSyncBehaviour};

// ─── CLI Surface ──────────────────────────────────────────────────────────────

#[derive(Subcommand, Debug)]
pub enum SimulateCommand {
    /// Boot an isolated multi-node mesh locally for integration testing
    Mesh {
        /// Number of virtual edge nodes to spawn (2–8)
        #[arg(long, default_value = "3")]
        nodes: usize,

        /// Path to a compiled .qos WASM module to auto-load on Node 1
        #[arg(long)]
        module: Option<PathBuf>,
    },
}

pub async fn run(cmd: SimulateCommand) -> Result<()> {
    match cmd {
        SimulateCommand::Mesh { nodes, module } => run_mesh(nodes, module).await,
    }
}

// ─── Per-node handle ─────────────────────────────────────────────────────────

struct NodeHandle {
    id: usize,
    peer_id: PeerId,
    api_port: u16,
    /// Resolved TCP listen Multiaddr once the swarm is bound
    listen_addr: Arc<Mutex<Option<Multiaddr>>>,
    /// Telemetry broadcast channel for this node
    telemetry_rx: broadcast::Receiver<String>,
    /// Signal to shut down the node
    _shutdown_tx: oneshot::Sender<()>,
}

// ─── Core ─────────────────────────────────────────────────────────────────────

async fn run_mesh(node_count: usize, module: Option<PathBuf>) -> Result<()> {
    let count = node_count.clamp(2, 8);

    print_banner(count);

    let mut handles: Vec<NodeHandle> = Vec::with_capacity(count);

    // ── 1. Boot every node ────────────────────────────────────────────────────
    for i in 1..=count {
        let h = boot_node(i, count).await?;

        let status_color = format!("Node {:02}", i);
        println!(
            "  {} {} | peer_id={} | api=:{} | state=/tmp/qos_sim_{}",
            "✔".fg_rgb::<0, 255, 65>(),
            status_color.fg_rgb::<0, 212, 255>().bold(),
            h.peer_id.to_string()[..12].fg_rgb::<199, 146, 234>(),
            h.api_port,
            i,
        );
        handles.push(h);
    }

    println!();

    // ── 2. Wait for all swarms to bind & collect addresses ────────────────────
    println!("{}", "Waiting for swarms to bind TCP listeners...".fg_rgb::<255, 204, 0>());
    let mut listen_addrs: Vec<Multiaddr> = Vec::new();
    for h in &handles {
        let addr = poll_listen_addr(&h.listen_addr, Duration::from_secs(5)).await
            .with_context(|| format!("Node {} failed to bind within 5s", h.id))?;
        println!(
            "  {} Node {:02} listening on {}",
            "►".fg_rgb::<0, 212, 255>(),
            h.id,
            addr.to_string().fg_rgb::<100, 100, 100>(),
        );
        listen_addrs.push(addr);
    }

    // ── 3. Dial every peer from every other peer via the API ──────────────────
    println!();
    println!("{}", "Forming closed mesh — dialling all node pairs...".fg_rgb::<255, 204, 0>());
    let client = reqwest::Client::new();
    for (i, h) in handles.iter().enumerate() {
        for (j, addr) in listen_addrs.iter().enumerate() {
            if i == j {
                continue; // don't dial yourself
            }
            let url = format!("http://127.0.0.1:{}/api/v1/network/dial", h.api_port);
            let body = serde_json::json!({ "multiaddr": addr.to_string() });
            match client.post(&url).json(&body).send().await {
                Ok(resp) if resp.status().is_success() => {
                    println!(
                        "  {} Node {:02} → Node {:02}  dialled",
                        "⟶".fg_rgb::<0, 255, 65>(),
                        h.id, j + 1,
                    );
                }
                Ok(resp) => {
                    println!(
                        "  {} Node {:02} → Node {:02}  ({})",
                        "⚠".fg_rgb::<255, 204, 0>(),
                        h.id, j + 1,
                        resp.status()
                    );
                }
                Err(e) => {
                    // Dial API may not be available yet — non-fatal
                    println!(
                        "  {} Node {:02} → Node {:02}  dial skipped: {}",
                        "⚠".fg_rgb::<255, 204, 0>(),
                        h.id, j + 1,
                        e
                    );
                }
            }
        }
    }

    // Brief stabilisation delay to let Identify/Gossipsub subscriptions settle
    tokio::time::sleep(Duration::from_millis(800)).await;

    // ── 4. Optionally load a module onto Node 1 ───────────────────────────────
    if let Some(module_path) = &module {
        let bytes = tokio::fs::read(module_path)
            .await
            .with_context(|| format!("Reading module {:?}", module_path))?;
        let hex = hex::encode(&bytes);
        let url = format!("http://127.0.0.1:{}/api/v1/modules/load", handles[0].api_port);
        let body = serde_json::json!({ "wasm_hex": hex, "name": "sim_module" });
        match client.post(&url).json(&body).send().await {
            Ok(r) if r.status().is_success() => {
                println!(
                    "\n  {} Loaded {} onto Node 01",
                    "✔".fg_rgb::<0, 255, 65>(),
                    module_path.display()
                );
            }
            Ok(r) => println!(
                "\n  {} Module load returned {}",
                "⚠".fg_rgb::<255, 204, 0>(), r.status()
            ),
            Err(e) => println!(
                "\n  {} Module load failed: {}",
                "⚠".fg_rgb::<255, 204, 0>(), e
            ),
        }
    }

    // ── 5. Spawn live log fan-out tasks ───────────────────────────────────────
    for h in &mut handles {
        // Move per-node receiver into an async task that pretty-prints lines
        let node_id = h.id;
        let mut rx = h.telemetry_rx.resubscribe();
        tokio::spawn(async move {
            while let Ok(line) = rx.recv().await {
                // Keep the log readable: trim JSON noise, colour per-node
                let preview = if line.len() > 140 { &line[..140] } else { &line };
                let (r, g, b) = node_color(node_id);
                eprintln!(
                    "{} {}",
                    format!("[Node {:02}]", node_id).fg_rgb_dyn(r, g, b),
                    preview.fg_rgb::<180, 180, 180>(),
                );
            }
        });
    }

    // ── 6. Interactive REPL ───────────────────────────────────────────────────
    println!();
    println!("{}", "═".repeat(70).fg_rgb::<0, 255, 65>());
    println!(
        "{}",
        "  MESH SIMULATOR READY — Interactive REPL".fg_rgb::<0, 255, 65>().bold()
    );
    println!("{}", "═".repeat(70).fg_rgb::<0, 255, 65>());
    println!();
    println!("  Commands:");
    println!(
        "    {}  — trigger execution on Node N",
        "trigger <N> [json_payload]".fg_rgb::<0, 212, 255>()
    );
    println!(
        "    {}  — GET current state key from Node N",
        "state <N> <key>".fg_rgb::<0, 212, 255>()
    );
    println!(
        "    {}  — show mesh topology",
        "topology".fg_rgb::<0, 212, 255>()
    );
    println!(
        "    {}  — exit simulator",
        "exit".fg_rgb::<255, 100, 100>()
    );
    println!();

    let ports: Vec<u16> = handles.iter().map(|h| h.api_port).collect();

    loop {
        // Print prompt
        eprint!("{} ", "qos-sim ›".fg_rgb::<0, 255, 65>().bold());

        // Read a line from stdin
        let mut line = String::new();
        if tokio::io::AsyncBufReadExt::read_line(
            &mut tokio::io::BufReader::new(tokio::io::stdin()),
            &mut line,
        )
        .await? == 0
        {
            break; // EOF
        }

        let parts: Vec<&str> = line.trim().splitn(3, ' ').collect();
        match parts.as_slice() {
            ["exit"] | ["quit"] => break,

            ["trigger", node_str] | ["trigger", node_str, _] => {
                let payload_str = parts.get(2).copied().unwrap_or("{}");
                let node_idx: usize = node_str.parse().unwrap_or(1);
                if node_idx < 1 || node_idx > count {
                    eprintln!("  Node index must be 1–{}", count);
                    continue;
                }
                let port = ports[node_idx - 1];
                let url = format!("http://127.0.0.1:{}/api/v1/invoke/sim_module", port);
                let body: serde_json::Value = serde_json::from_str(payload_str)
                    .unwrap_or_else(|_| serde_json::json!({"input": payload_str}));

                println!(
                    "  {} Firing trigger on {} → {}",
                    "►".fg_rgb::<0, 212, 255>(),
                    format!("Node {:02}", node_idx).fg_rgb::<0, 255, 65>().bold(),
                    url.fg_rgb::<100, 100, 100>(),
                );

                match client.post(&url).json(&body).send().await {
                    Ok(resp) => {
                        let status = resp.status();
                        let body_text = resp.text().await.unwrap_or_default();
                        println!(
                            "  {} HTTP {} — {}",
                            if status.is_success() { "✔".fg_rgb::<0,255,65>().to_string() } else { "✘".fg_rgb::<255,50,50>().to_string() },
                            status,
                            body_text,
                        );
                        println!(
                            "  {} Watch the log feed above for CRDT propagation to other nodes.",
                            "ℹ".fg_rgb::<0, 212, 255>()
                        );
                    }
                    Err(e) => eprintln!("  {} {}", "✘".fg_rgb::<255,50,50>(), e),
                }
            }

            ["state", node_str, key] => {
                let node_idx: usize = node_str.parse().unwrap_or(1);
                if node_idx < 1 || node_idx > count {
                    eprintln!("  Node index must be 1–{}", count);
                    continue;
                }
                let port = ports[node_idx - 1];
                let url = format!("http://127.0.0.1:{}/api/v1/state/{}", port, key);
                match client.get(&url).send().await {
                    Ok(resp) => {
                        let val = resp.text().await.unwrap_or_default();
                        println!(
                            "  {} [Node {:02}] {} = {}",
                            "►".fg_rgb::<0, 212, 255>(),
                            node_idx, key.fg_rgb::<199, 146, 234>(), val.fg_rgb::<0,255,65>(),
                        );
                    }
                    Err(e) => eprintln!("  {} {}", "✘".fg_rgb::<255,50,50>(), e),
                }
            }

            ["topology"] => {
                println!("  {}", "Current Mesh Topology:".fg_rgb::<0, 212, 255>().bold());
                for (i, h) in handles.iter().enumerate() {
                    let port = ports[i];
                    let url = format!("http://127.0.0.1:{}/api/v1/network/inspect", port);
                    match client.get(&url).send().await {
                        Ok(resp) if resp.status().is_success() => {
                            let text = resp.text().await.unwrap_or_default();
                            // Extract peer count from JSON cheaply
                            let peer_count = text.matches("peer_id").count().saturating_sub(1);
                            println!(
                                "    {} Node {:02} | port={} | peers={}",
                                "▣".fg_rgb::<0, 255, 65>(),
                                i + 1, port, peer_count,
                            );
                        }
                        _ => {
                            println!(
                                "    {} Node {:02} | port={} | (no response)",
                                "▣".fg_rgb::<100,100,100>(),
                                i + 1, port,
                            );
                        }
                    }
                }
            }

            _ => {
                eprintln!(
                    "  {} Unknown command. Try: trigger <N>, state <N> <key>, topology, exit",
                    "⚠".fg_rgb::<255, 204, 0>()
                );
            }
        }
    }

    println!("\n{}", "Shutting down mesh simulator...".fg_rgb::<255, 50, 50>());
    // NodeHandles drop here, firing their oneshot shutdown signals
    Ok(())
}

// ─── Boot a single isolated node ─────────────────────────────────────────────

async fn boot_node(id: usize, _total: usize) -> Result<NodeHandle> {
    // Each node gets a deterministic API port and isolated temp state dir
    let api_port = 3000u16 + id as u16;
    let state_dir = PathBuf::from(format!("/tmp/qos_sim_{}", id));
    let cache_dir = PathBuf::from(format!("/tmp/qos_sim_{}_cache", id));
    tokio::fs::create_dir_all(&state_dir).await?;
    tokio::fs::create_dir_all(&cache_dir).await?;

    // Fresh Sled DB — isolate state completely
    let state = Arc::new(
        SledStateStore::open(&state_dir).context("Opening simulated Sled DB")?,
    );

    let (telemetry_tx, telemetry_rx) = broadcast::channel::<String>(512);

    let event_bus = EventBus::new();

    // Subscribe to engine events and forward to telemetry channel
    let mut event_sub = event_bus.subscribe();
    let ev_tx = telemetry_tx.clone();
    tokio::spawn(async move {
        while let Some(ev) = event_sub.recv().await {
            let line = serde_json::json!({
                "type": "ENGINE_EVENT",
                "topic": ev.topic,
                "seq": ev.seq,
            })
            .to_string();
            let _ = ev_tx.send(line);
        }
    });

    let engine = ExecutionEngine::new(
        Arc::clone(&state),
        event_bus.clone(),
        EngineConfig::default(),
    )
    .context("Creating simulation ExecutionEngine")?;

    let bootloader = Arc::new(
        BootloaderPipeline::new(BootloaderConfig {
            allow_list: UriAllowList::new(vec![]),
            policy: PolicyEngine::new(vec![], false), // no license checks in sim
            cache_dir: cache_dir.clone(),
        })
        .context("Creating simulation BootloaderPipeline")?,
    );

    // Fresh ephemeral libp2p identity per node
    let local_key = identity::Keypair::generate_ed25519();
    let peer_id = local_key.public().to_peer_id();

    let listen_addr_slot: Arc<Mutex<Option<Multiaddr>>> = Arc::new(Mutex::new(None));
    let listen_addr_slot_clone = Arc::clone(&listen_addr_slot);

    let mut swarm = libp2p::SwarmBuilder::with_existing_identity(local_key)
        .with_tokio()
        .with_tcp(
            libp2p::tcp::Config::default(),
            libp2p::noise::Config::new,
            libp2p::yamux::Config::default,
        )?
        .with_dns()?
        .with_relay_client(libp2p::noise::Config::new, libp2p::yamux::Config::default)?
        .with_behaviour(|key, relay_behaviour| {
            QosSyncBehaviour::new(key, relay_behaviour).expect("Failed to init sim behaviour")
        })?
        .with_swarm_config(|cfg| cfg.with_idle_connection_timeout(Duration::from_secs(30)))
        .build();

    // Listen on a deterministic port per node
    let p2p_port = 4000u16 + id as u16;
    let listen_ma: Multiaddr = format!("/ip4/127.0.0.1/tcp/{}", p2p_port).parse()?;
    swarm.listen_on(listen_ma.clone())?;

    let (sync_engine, network_state) =
        StateSyncEngine::spawn(swarm, Arc::clone(&state), telemetry_tx.clone())
            .await
            .context("Spawning StateSyncEngine for simulated node")?;

    // Capture the resolved listen address once the swarm binds
    let addr_capture = listen_addr_slot_clone.clone();
    tokio::spawn(async move {
        // Give the swarm a moment to bind and expose its address
        tokio::time::sleep(Duration::from_millis(200)).await;
        let mut addr = addr_capture.lock().await;
        *addr = Some(listen_ma);
    });

    let api_state = qos_api::ApiState {
        bootloader: bootloader.clone(),
        execution_engine: engine.clone(),
        auth_token: format!("sim-token-{}", id),
        tx_telemetry: telemetry_tx.clone(),
        network_state: network_state.clone(),
    };

    // Mirror state mutations into telemetry
    let mut state_sub = state.watch_all();
    let state_tx = telemetry_tx.clone();
    tokio::task::spawn_blocking(move || {
        for event in state_sub {
            let line = match event {
                sled::Event::Insert { key, value } => {
                    format!(
                        r#"{{"type":"STATE_MUTATION","key":"{}","value":"{}"}}"#,
                        String::from_utf8_lossy(&key),
                        String::from_utf8_lossy(&value),
                    )
                }
                sled::Event::Remove { key } => {
                    format!(
                        r#"{{"type":"STATE_REMOVE","key":"{}"}}"#,
                        String::from_utf8_lossy(&key),
                    )
                }
            };
            let _ = state_tx.send(line);
        }
    });

    let (shutdown_tx, shutdown_rx) = oneshot::channel::<()>();

    // Start the API server bound to the node-specific port
    tokio::spawn(async move {
        tokio::select! {
            result = start_api_on_port(api_state, api_port) => {
                if let Err(e) = result {
                    info!("Sim node {} API error: {}", id, e);
                }
            }
            _ = shutdown_rx => {
                info!("Sim node {} shutting down", id);
            }
        }
    });

    Ok(NodeHandle {
        id,
        peer_id,
        api_port,
        listen_addr: listen_addr_slot,
        telemetry_rx,
        _shutdown_tx: shutdown_tx,
    })
}

// ─── Start API on an explicit port ───────────────────────────────────────────

async fn start_api_on_port(api_state: qos_api::ApiState, port: u16) -> Result<()> {
    // We set the PORT env var which qos_api::start_server reads
    std::env::set_var("QOS_API_PORT", port.to_string());
    qos_api::start_server(api_state)
        .await
        .context("API server error")
}

// ─── Poll the listen address slot ────────────────────────────────────────────

async fn poll_listen_addr(
    slot: &Arc<Mutex<Option<Multiaddr>>>,
    timeout: Duration,
) -> Result<Multiaddr> {
    let deadline = tokio::time::Instant::now() + timeout;
    loop {
        {
            let guard = slot.lock().await;
            if let Some(addr) = &*guard {
                return Ok(addr.clone());
            }
        }
        if tokio::time::Instant::now() >= deadline {
            anyhow::bail!("Timed out waiting for swarm listen address");
        }
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
}

// ─── Node colour palette ─────────────────────────────────────────────────────

fn node_color(id: usize) -> (u8, u8, u8) {
    const PALETTE: [(u8, u8, u8); 8] = [
        (0, 255, 65),    // green  — node 1
        (0, 212, 255),   // cyan   — node 2
        (199, 146, 234), // purple — node 3
        (255, 204, 0),   // yellow — node 4
        (255, 122, 47),  // orange — node 5
        (255, 50, 50),   // red    — node 6
        (80, 250, 123),  // mint   — node 7
        (189, 147, 249), // lavender — node 8
    ];
    PALETTE[(id.saturating_sub(1)) % PALETTE.len()]
}

// ─── ASCII banner ─────────────────────────────────────────────────────────────

fn print_banner(count: usize) {
    println!();
    println!("{}", "╔══════════════════════════════════════════════════════════════╗".fg_rgb::<0,255,65>());
    println!("{}", "║          Q-OS MESH SIMULATOR — DEVELOPER MODE               ║".fg_rgb::<0,255,65>().bold());
    println!("{}", "╚══════════════════════════════════════════════════════════════╝".fg_rgb::<0,255,65>());
    println!();
    println!(
        "  {} Booting {} isolated Q-OS nodes with libp2p Gossipsub mesh...",
        "►".fg_rgb::<0, 212, 255>(),
        count.to_string().fg_rgb::<0, 255, 65>().bold(),
    );
    println!(
        "  {} Cryptographic license checks {} for simulation",
        "ℹ".fg_rgb::<0, 212, 255>(),
        "DISABLED".fg_rgb::<255, 204, 0>().bold(),
    );
    println!(
        "  {} Sled DBs isolated to {}",
        "ℹ".fg_rgb::<0, 212, 255>(),
        "/tmp/qos_sim_N/".fg_rgb::<100, 100, 100>(),
    );
    println!();
}

// ─── OwoColors RGB helper (runtime colours) ───────────────────────────────────
trait FgRgbDyn {
    fn fg_rgb_dyn(&self, r: u8, g: u8, b: u8) -> String;
}
impl FgRgbDyn for str {
    fn fg_rgb_dyn(&self, r: u8, g: u8, b: u8) -> String {
        format!("\x1b[38;2;{};{};{}m{}\x1b[0m", r, g, b, self)
    }
}
