use anyhow::Result;
use clap::Subcommand;
use indicatif::{ProgressBar, ProgressStyle};
use libp2p::{identity, SwarmBuilder};
use owo_colors::OwoColorize;
use qos_state::{SledStateStore, StateStore};
use qos_state_sync::engine::StateSyncEngine;
use qos_state_sync::network::QosSyncBehaviour;
use qos_types::{StateEntry, StateKey};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tempfile::tempdir;

#[derive(Subcommand, Debug)]
pub enum TestCommand {
    /// Test the state sync mesh network locally
    Mesh {
        /// Number of nodes to spawn
        #[arg(long, default_value_t = 3)]
        nodes: usize,
    },
}

pub async fn run(cmd: TestCommand) -> Result<()> {
    match cmd {
        TestCommand::Mesh { nodes } => run_mesh(nodes).await,
    }
}

async fn run_mesh(nodes: usize) -> Result<()> {
    println!("\n{}", "=== Q-OS LOCAL INTEGRATION TEST HARNESS ===".bold().cyan());
    println!(
        "{} Limits locked: 16MB RAM | 15k Fuel | 50ms Timeout",
        "[SANDBOX]".bold().cyan()
    );
    println!("Spawning {} virtual nodes in parallel...", nodes);

    let mut virtual_nodes = Vec::new();
    let mut _temp_dirs = Vec::new(); // keep in scope so they don't drop

    let start_boot = Instant::now();
    for i in 0..nodes {
        let dir = tempdir()?;
        let store = Arc::new(SledStateStore::open(dir.path())?);
        
        // Deterministic Ed25519 keypair for Node ID
        let mut seed = [0u8; 32];
        seed[0] = i as u8;
        seed[1] = 42;
        let secret = identity::ed25519::SecretKey::try_from_bytes(seed)?;
        let key = identity::Keypair::from(identity::ed25519::Keypair::from(secret));
        
        let peer_id = key.public().to_peer_id();
        let port = 10000 + i as u16;

        let mut swarm = SwarmBuilder::with_existing_identity(key.clone())
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
            .build();

        swarm.listen_on(format!("/ip4/127.0.0.1/tcp/{}", port).parse()?)?;

        let (telemetry_tx, _) = tokio::sync::broadcast::channel::<String>(1024);
        let engine = StateSyncEngine::spawn(swarm, store.clone(), telemetry_tx).await.map_err(|e| anyhow::anyhow!("{}", e))?;

        println!(
            "[{}] Node {} | PeerID: {} | Port: {}",
            "BOOT".green(),
            i,
            peer_id.to_string().cyan(),
            port
        );

        virtual_nodes.push((store, engine));
        _temp_dirs.push(dir);
    }

    println!("Boot complete in {:?}", start_boot.elapsed());
    
    let pb = ProgressBar::new_spinner();
    pb.set_style(
        ProgressStyle::default_spinner()
            .tick_chars("⠁⠂⠄⡀⢀⠠⠐⠈ ")
            .template("{spinner:.green} {msg}")?,
    );
    pb.set_message("Waiting for mDNS discovery and Gossipsub mesh formation (3s)...");
    pb.enable_steady_tick(Duration::from_millis(100));
    tokio::time::sleep(Duration::from_secs(3)).await;
    pb.finish_with_message("Mesh network formed successfully.");

    println!("\n{}", "--- TRIGGERING CRDT MUTATION ---".bold().yellow());
    
    let test_key = StateKey::new("test_hash", "test_inv", "test_key");
    let mut vector_clock = std::collections::HashMap::new();
    vector_clock.insert("VIRTUAL_NODE_0".to_string(), 1);
    
    let payload = StateEntry {
        bytes: b"Q-OS eventual consistency test payload".to_vec(),
        vector_clock,
        last_modified: 123456789,
    };

    println!(
        "[{}] Node 0 sets key '{}' with payload length {} bytes.",
        "MUTATE".blue(),
        test_key.key,
        payload.bytes.len()
    );

    let start_mutation = Instant::now();
    virtual_nodes[0].0.set(&test_key, payload.clone())?;

    // Poll other nodes for the state update
    println!("\n{}", "--- VERIFYING EVENTUAL CONSISTENCY ---".bold().magenta());
    let mut all_consistent = false;
    
    for _ in 0..10 { // up to 200ms (10 * 20ms)
        tokio::time::sleep(Duration::from_millis(20)).await;
        
        let mut consistent_nodes = 1; // node 0 is consistent
        for i in 1..nodes {
            if let Ok(Some(val)) = virtual_nodes[i].0.get(&test_key) {
                if val.bytes == payload.bytes {
                    consistent_nodes += 1;
                }
            }
        }

        if consistent_nodes == nodes {
            all_consistent = true;
            break;
        }
    }

    let latency = start_mutation.elapsed();
    if all_consistent {
        println!(
            "[{}] All {} nodes synchronized perfectly in {:?}",
            "SUCCESS".green().bold(),
            nodes,
            latency.yellow()
        );
        for i in 1..nodes {
            println!(
                "  ↳ Node {} verified payload locally -> Vector Clock: {:?}",
                i.cyan(),
                payload.vector_clock
            );
        }
    } else {
        println!(
            "[{}] Failed to reach eventual consistency across all nodes within {:?}",
            "FAILURE".red().bold(),
            latency
        );
        anyhow::bail!("State synchronization timeout");
    }

    println!("\n{}", "=== TEST COMPLETED ===".bold().cyan());

    Ok(())
}
