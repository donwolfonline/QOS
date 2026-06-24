//! Core types for state synchronization.

use qos_types::sync::{StateKey, StateEntry};
use serde::{Deserialize, Serialize};

/// Represents a single state mutation to be broadcast over the network.
/// Implements a Vector Clock causal consistency approach.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct StateDelta {
    /// The unique namespace and key being mutated.
    pub key: StateKey,
    
    /// The new value for this key. 
    /// If `None`, this represents a tombstone (deletion).
    pub value: Option<StateEntry>,
    
    /// The unique Peer ID of the node that originated this mutation.
    pub origin_peer_id: String,
}
