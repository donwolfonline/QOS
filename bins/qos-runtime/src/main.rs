//! Q-OS runtime binary entry point.

mod config;
mod context;

use anyhow::{Context, Result};
use clap::Parser;
use std::path::PathBuf;
use std::sync::Arc;

use qos_bootloader::pipeline::{BootloaderConfig, BootloaderPipeline};
use qos_engine::engine::{EngineConfig, ExecutionEngine};
use qos_engine::event_bus::EventBus;
use qos_policy::{PolicyEngine, UriAllowList};
use qos_state::SledStateStore;
use qos_state_sync::{network::QosSyncBehaviour, engine::StateSyncEngine};
use tracing::{info, error};
use tracing_subscriber::fmt::writer::MakeWriterExt;
use libp2p::{identity, Swarm};

use config::RuntimeConfig;
use context::QosSystemContext;

/// Q-OS: QR-triggered WebAssembly edge runtime.
#[derive(Parser, Debug)]
#[command(name = "qos-runtime", version, about)]
struct Cli {
    /// Path to the TOML runtime configuration file.
    #[arg(short, long, default_value = "qos.toml")]
    config: std::path::PathBuf,

    /// Enable strict mode (require Ed25519 signatures on all modules).
    #[arg(long)]
    strict: bool,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let (telemetry_tx, _) = tokio::sync::broadcast::channel::<String>(1024);
    let broadcast_writer = qos_api::BroadcastWriter::new(telemetry_tx.clone());

    // ── Initialise tracing ────────────────────────────────────────────────────
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("qos=info".parse()?)
                .add_directive("qos_api=info".parse()?),
        )
        .json()
        .with_writer(std::io::stdout.and(broadcast_writer))
        .init();

    let cli = Cli::parse();
    info!(config = %cli.config.display(), strict = cli.strict, "Q-OS runtime starting");

    // ── Load config ───────────────────────────────────────────────────────────
    let cfg_text = std::fs::read_to_string(&cli.config)
        .with_context(|| format!("reading config from {:?}", cli.config))?;
    let cfg: RuntimeConfig = toml::from_str(&cfg_text)?;

    // ── Initialise state store ────────────────────────────────────────────────
    let state = Arc::new(
        SledStateStore::open(&cfg.state_dir)
            .context("opening sled state store")?,
    );

    // ── Initialise event bus ──────────────────────────────────────────────────
    let event_bus = EventBus::new();

    // Spawn a background task that logs all engine events.
    let mut event_sub = event_bus.subscribe();
    tokio::spawn(async move {
        while let Some(event) = event_sub.recv().await {
            info!(
                seq = event.seq,
                invocation = %event.invocation_id,
                topic = %event.topic,
                payload_bytes = event.payload.len(),
                "engine event"
            );
        }
    });

    // ── Initialise execution engine ───────────────────────────────────────────
    let engine = ExecutionEngine::new(
        Arc::clone(&state),
        event_bus.clone(),
        EngineConfig::default(),
    )
    .context("initialising execution engine")?;

    info!(
        registry_capacity = EngineConfig::default().registry_capacity,
        fuel_limit = EngineConfig::default().fuel_limit,
        memory_limit_mib = EngineConfig::default().memory_limit_bytes / (1024 * 1024),
        "ExecutionEngine ready"
    );

    // ── Initialise bootloader ─────────────────────────────────────────────────
    let allow_list = UriAllowList::new(cfg.allowed_origins.clone());
    let policy = PolicyEngine::new(vec![], cli.strict);

    let bootloader = BootloaderPipeline::new(BootloaderConfig {
        allow_list,
        policy,
        cache_dir: cfg.cache_dir.clone(),
    })
    .context("initialising bootloader")?;

    // ── Initialise P2P state sync ─────────────────────────────────────────────
    let local_key = identity::Keypair::generate_ed25519();
    let local_peer_id = local_key.public().to_peer_id();
    info!(peer_id = %local_peer_id, "Generated local P2P identity");

    let behaviour = QosSyncBehaviour::new(&local_key).map_err(|e| anyhow::anyhow!(e.to_string()))?;

    let mut swarm = libp2p::SwarmBuilder::with_existing_identity(local_key)
        .with_tokio()
        .with_tcp(
            libp2p::tcp::Config::default(),
            libp2p::noise::Config::new,
            libp2p::yamux::Config::default,
        )?
        .with_behaviour(|_| behaviour).map_err(|e| anyhow::anyhow!(e))?
        .with_swarm_config(|cfg| cfg.with_idle_connection_timeout(std::time::Duration::from_secs(60)))
        .build();

    // Listen on all interfaces, random OS-assigned port
    swarm.listen_on("/ip4/0.0.0.0/tcp/0".parse()?)?;

    // Spawn the Sync Engine Actor
    let sync_engine = StateSyncEngine::spawn(swarm, Arc::clone(&state)).await.expect("Failed to spawn Sync Engine");

    info!("Q-OS runtime components initialized, building system context...");

    let ctx = QosSystemContext {
        state_store: state,
        sync_engine,
        execution_engine: engine,
        bootloader: Arc::new(bootloader),
    };

    // ── Initialise Auth Token ─────────────────────────────────────────────────
    let auth_token = cfg.api_auth_token.unwrap_or_else(|| {
        let token = uuid::Uuid::new_v4().to_string();
        info!("Generated temporary API Key: {}", token);
        token
    });

    // ── Start API Server ──────────────────────────────────────────────────────
    let api_state = qos_api::ApiState {
        bootloader: ctx.bootloader.clone(),
        execution_engine: ctx.execution_engine.clone(),
        auth_token: auth_token.clone(),
        tx_telemetry: telemetry_tx,
    };

    tokio::spawn(async move {
        if let Err(e) = qos_api::start_server(api_state).await {
            error!("qos-api server failed: {}", e);
        }
    });

    // ── Print Daemon Connect QR ───────────────────────────────────────────────
    if let Ok(local_ip) = local_ip_address::local_ip() {
        let uri = format!("qos://{}:3000?token={}", local_ip, auth_token);
        println!("\n=== Scan to connect Q-OS Controller Mobile App ===");
        if let Err(e) = qr2term::print_qr(&uri) {
            error!("Failed to print connection QR: {}", e);
        }
        println!("URI: {}\n", uri);
    } else {
        error!("Could not resolve local IP for QR code.");
    }

    ctx.run_loop().await?;

    Ok(())
}
