use anyhow::{Context, Result};
use clap::Subcommand;
use owo_colors::OwoColorize;
use owo_colors::colors::css::{Lime, DeepSkyBlue, Gray};
use qos_types::network::{ConnectionType, NetworkState};
use reqwest::Client;

#[derive(Subcommand, Debug)]
pub enum NetworkCommand {
    /// Inspect the local node's libp2p Swarm state
    Inspect {
        /// API Authentication token
        #[arg(long, env = "QOS_TOKEN")]
        token: Option<String>,
        
        /// API Port
        #[arg(long, default_value = "3000")]
        port: u16,
    },
}

pub async fn run(action: NetworkCommand) -> Result<()> {
    match action {
        NetworkCommand::Inspect { token, port } => inspect_network(token, port).await,
    }
}

async fn inspect_network(token: Option<String>, port: u16) -> Result<()> {
    let client = Client::new();
    let url = format!("http://127.0.0.1:{}/api/v1/network/inspect", port);
    
    let mut req = client.get(&url);
    if let Some(t) = token {
        req = req.header("x-qos-api-key", t);
    }
    
    let res = req.send().await.context("Failed to connect to local Q-OS daemon. Is it running?")?;
    if !res.status().is_success() {
        let status = res.status();
        let body = res.text().await.unwrap_or_default();
        anyhow::bail!("API returned error {}: {}", status, body);
    }
    
    let state: NetworkState = res.json().await.context("Failed to parse NetworkState JSON from daemon")?;
    
    println!("\n=== Q-OS LOCAL NODE NETWORK INSPECTION ===");
    println!("Node ID: {}", state.local_peer_id.fg::<Lime>().bold());
    println!("Listen Addresses:");
    if state.listen_addrs.is_empty() {
        println!("  (None)");
    } else {
        for addr in &state.listen_addrs {
            println!("  - {}", addr.fg::<Gray>());
        }
    }
    println!();
    
    println!("Connected Global Peers ({}):", state.peers.len());
    if state.peers.is_empty() {
        println!("  (No peers currently connected)");
    } else {
        for (peer_id, info) in &state.peers {
            let latency_str = if let Some(lat) = info.latency_ms {
                format!("{}ms", lat)
            } else {
                "??ms".to_string()
            };
            
            let (conn_type_str, colored_peer) = match info.connection_type {
                ConnectionType::Direct => {
                    ("[DIRECT]", peer_id.fg::<Lime>().to_string())
                },
                ConnectionType::Relayed => {
                    ("[RELAY] ", peer_id.fg::<DeepSkyBlue>().to_string())
                },
                ConnectionType::Unknown => {
                    ("[?????] ", peer_id.fg::<Gray>().to_string())
                }
            };
            
            println!("  ├── {}", colored_peer);
            
            let addr_str = info.multiaddr.as_deref().unwrap_or("Unknown address");
            
            println!("  │   {} | Ping: {}", conn_type_str.fg::<Gray>(), latency_str.fg::<Gray>());
            println!("  │   {}", addr_str.fg::<Gray>());
        }
    }
    
    println!();
    Ok(())
}
