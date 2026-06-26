use anyhow::{Context, Result};
use clap::Subcommand;
use libp2p::identity;
use owo_colors::OwoColorize;
use qos_bootloader::pipeline::{BootloaderConfig, BootloaderPipeline};
use qos_engine::engine::{EngineConfig, ExecutionEngine};
use qos_engine::event_bus::EventBus;
use qos_policy::{PolicyEngine, UriAllowList};
use qos_state::SledStateStore;
use qos_state_sync::{engine::StateSyncEngine, network::QosSyncBehaviour};
use std::path::PathBuf;
use std::sync::Arc;
use tracing::error;
use indicatif::{ProgressBar, ProgressStyle};

#[derive(Subcommand, Debug)]
pub enum NodeCommand {
    /// Generates local cryptographic node keys, initializes an empty SledStateStore, and creates a base config.toml.
    Init,
    /// Boots the headless Axum daemon, activates mDNS discovery, and binds to local network interfaces.
    Start {
        /// Enable strict mode (require Ed25519 signatures on all modules).
        #[arg(long)]
        strict: bool,
    },
}

pub async fn run(cmd: NodeCommand) -> Result<()> {
    match cmd {
        NodeCommand::Init => {
            println!("{}", "Initializing Q-OS Node...".fg_rgb::<0, 212, 255>());

            let pb = ProgressBar::new_spinner();
            pb.set_style(
                ProgressStyle::default_spinner()
                    .tick_chars("⠁⠂⠄⡀⢀⠠⠐⠈ ")
                    .template("{spinner:.green} {msg}")?,
            );
            pb.set_message("Generating cryptographic identity...");

            // Generate Keys
            let keypair = identity::Keypair::generate_ed25519();
            let peer_id = keypair.public().to_peer_id();
            
            // Save keys
            let key_bytes = keypair.to_protobuf_encoding()?;
            std::fs::write(".qos-identity.bin", key_bytes).context("Failed to write identity key")?;

            pb.set_message("Initializing local state store...");
            // Initialize SledStateStore
            let state_dir = PathBuf::from(".qos-state");
            let _state = SledStateStore::open(&state_dir).context("Failed to initialize state store")?;

            pb.set_message("Writing default config.toml...");
            // Write config.toml
            let config_content = r#"
allowed_origins = []
cache_dir = ".qos-cache"
state_dir = ".qos-state"
sync_log_path = ".qos-sync.log"
"#;
            std::fs::write("config.toml", config_content.trim())
                .context("Failed to write config.toml")?;

            pb.finish_with_message("Done!");
            println!(
                "{} Node initialized successfully. (Peer ID: {})",
                "✔".fg_rgb::<0, 255, 65>(),
                peer_id
            );
            Ok(())
        }
        NodeCommand::Start { strict } => {
            println!("{}", "Booting Q-OS Node...".fg_rgb::<0, 212, 255>());
            
            let pb = ProgressBar::new_spinner();
            pb.set_style(
                ProgressStyle::default_spinner()
                    .tick_chars("⠁⠂⠄⡀⢀⠠⠐⠈ ")
                    .template("{spinner:.cyan} {msg}")?,
            );
            pb.set_message("Loading state & initializing engine...");

            let state_dir = PathBuf::from(".qos-state");
            let state = Arc::new(
                SledStateStore::open(&state_dir).context("opening sled state store")?,
            );

            let event_bus = EventBus::new();
            let engine = ExecutionEngine::new(
                Arc::clone(&state),
                event_bus.clone(),
                EngineConfig::default(),
            )
            .context("initialising execution engine")?;

            let bootloader = BootloaderPipeline::new(BootloaderConfig {
                allow_list: UriAllowList::new(vec![]),
                policy: PolicyEngine::new(vec![], strict),
                cache_dir: PathBuf::from(".qos-cache"),
            })
            .context("initialising bootloader")?;

            pb.set_message("Setting up P2P network (mDNS)...");

            let local_key = if std::path::Path::new(".qos-identity.bin").exists() {
                let bytes = std::fs::read(".qos-identity.bin")?;
                identity::Keypair::from_protobuf_encoding(&bytes)?
            } else {
                identity::Keypair::generate_ed25519()
            };

            let local_peer_id = local_key.public().to_peer_id();

            let mut swarm = libp2p::SwarmBuilder::with_existing_identity(local_key.clone())
                .with_tokio()
                .with_tcp(
                    libp2p::tcp::Config::default(),
                    libp2p::noise::Config::new,
                    libp2p::yamux::Config::default,
                )?
                .with_dns()?
                .with_relay_client(libp2p::noise::Config::new, libp2p::yamux::Config::default)?
                .with_behaviour(|key, relay_behaviour| {
                    QosSyncBehaviour::new(key, relay_behaviour).expect("Failed to init behaviour")
                })?
                .with_swarm_config(|cfg| cfg.with_idle_connection_timeout(std::time::Duration::from_secs(60)))
                .build();

            swarm.listen_on("/ip4/0.0.0.0/tcp/0".parse()?)?;

            let (telemetry_tx, _) = tokio::sync::broadcast::channel::<String>(1024);
            let (_sync_engine, network_state) = StateSyncEngine::spawn(swarm, Arc::clone(&state), telemetry_tx.clone())
                .await
                .expect("Failed to spawn Sync Engine");

            // Spawn the Topology Tick background task
            let tick_tx = telemetry_tx.clone();
            let tick_network_state = network_state.clone();
            tokio::spawn(async move {
                let mut interval = tokio::time::interval(std::time::Duration::from_secs(2));
                loop {
                    interval.tick().await;
                    if let Ok(state_guard) = tick_network_state.read() {
                        let payload = serde_json::json!({
                            "type": "NETWORK_TOPOLOGY_TICK",
                            "topology": *state_guard
                        });
                        let _ = tick_tx.send(payload.to_string());
                    }
                }
            });

            let auth_token = uuid::Uuid::new_v4().to_string();

            let api_state = qos_api::ApiState {
                bootloader: Arc::new(bootloader),
                execution_engine: engine,
                auth_token: auth_token.clone(),
                tx_telemetry: telemetry_tx.clone(),
                network_state,
            };

            pb.set_message("Starting Axum daemon on 127.0.0.1:3000...");
            tokio::spawn(async move {
                if let Err(e) = qos_api::start_server(api_state).await {
                    error!("qos-api server failed: {}", e);
                }
            });

            pb.finish_and_clear();
            println!(
                "{} Node is actively listening on 127.0.0.1:3000",
                "✔".fg_rgb::<0, 255, 65>()
            );

            if let Ok(local_ip) = local_ip_address::local_ip() {
                let uri = format!("qos://{}:3000?token={}", local_ip, auth_token);
                println!("\n=== Scan to connect Q-OS Controller Mobile App ===");
                if let Err(e) = qr2term::print_qr(&uri) {
                    error!("Failed to print connection QR: {}", e);
                }
                println!("URI: {}\n", uri);
            }

            // Keep the main thread alive.
            tokio::signal::ctrl_c().await?;
            println!("\nNode gracefully shutting down.");
            Ok(())
        }
    }
}
