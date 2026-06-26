use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct NetworkState {
    pub local_peer_id: String,
    pub listen_addrs: Vec<String>,
    pub peers: HashMap<String, PeerInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PeerInfo {
    pub multiaddr: Option<String>,
    pub latency_ms: Option<u64>,
    pub connection_type: ConnectionType,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
pub enum ConnectionType {
    #[default]
    Unknown,
    Direct,
    Relayed,
}
