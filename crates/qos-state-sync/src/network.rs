//! libp2p network behaviour definition for Q-OS state sync.

use libp2p::gossipsub::{self, MessageAuthenticity, ValidationMode};
use libp2p::mdns;
use libp2p::request_response::{self, ProtocolSupport};
use libp2p::swarm::NetworkBehaviour;
use libp2p::identity::Keypair;
use libp2p::StreamProtocol;
use serde::{Deserialize, Serialize};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::time::Duration;

use crate::types::StateDelta;

/// Request for a full state synchronization dump.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SyncRequest;

/// Response containing the full host state as a list of deltas.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SyncResponse {
    pub deltas: Vec<StateDelta>,
}

/// Custom network behaviour combining Gossipsub for message broadcast,
/// mDNS for local peer discovery, and Request-Response for immediate sync.
#[derive(NetworkBehaviour)]
pub struct QosSyncBehaviour {
    pub gossipsub: gossipsub::Behaviour,
    pub mdns: mdns::tokio::Behaviour,
    pub request_response: request_response::cbor::Behaviour<SyncRequest, SyncResponse>,
}

impl QosSyncBehaviour {
    /// Initialize a new Q-OS Sync Behaviour.
    pub fn new(local_key: &Keypair) -> Result<Self, Box<dyn std::error::Error>> {
        // Setup mDNS for local network discovery.
        let mdns = mdns::tokio::Behaviour::new(
            mdns::Config::default(),
            local_key.public().to_peer_id(),
        )?;

        // Setup Gossipsub for efficient P2P message broadcast.
        // To prevent duplicate messages across the mesh, we configure a custom MessageId
        // based on a hash of the message contents.
        let message_id_fn = |message: &gossipsub::Message| {
            let mut s = DefaultHasher::new();
            message.data.hash(&mut s);
            gossipsub::MessageId::from(s.finish().to_string())
        };

        let gossipsub_config = gossipsub::ConfigBuilder::default()
            .heartbeat_interval(Duration::from_secs(1))
            .validation_mode(ValidationMode::Strict) // Enforce message signatures
            .message_id_fn(message_id_fn) // Content-based addressing
            .build()
            .map_err(|msg| format!("Failed to build gossipsub config: {msg}"))?;

        let gossipsub = gossipsub::Behaviour::new(
            MessageAuthenticity::Signed(local_key.clone()),
            gossipsub_config,
        )?;

        // Setup Request-Response for immediate state sync upon discovery.
        let request_response = request_response::cbor::Behaviour::<SyncRequest, SyncResponse>::new(
            [(StreamProtocol::new("/qos/sync/1.0.0"), ProtocolSupport::Full)],
            request_response::Config::default(),
        );

        Ok(Self { gossipsub, mdns, request_response })
    }
}
