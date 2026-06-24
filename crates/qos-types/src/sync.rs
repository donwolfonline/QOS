//! State store types and sync event contracts.

use serde::{Deserialize, Serialize};

/// Namespaced key for the state store.
/// Format: `<module_sha256>/<invocation_id>/<user_key>`
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct StateKey {
    /// Combined namespace prefix: `"<module_sha256>/<invocation_id>"`.
    pub namespace: String,
    /// User-defined key within the namespace.
    pub key: String,
}

impl StateKey {
    pub fn new(module_sha256: &str, invocation_id: &str, key: &str) -> Self {
        Self {
            namespace: format!("{module_sha256}/{invocation_id}"),
            key: key.to_owned(),
        }
    }

    /// Returns the full compound key as a byte-string for KV storage.
    pub fn to_bytes(&self) -> Vec<u8> {
        format!("{}/{}", self.namespace, self.key).into_bytes()
    }

    /// Parses a StateKey back from its raw byte representation.
    pub fn from_bytes(bytes: &[u8]) -> Option<Self> {
        let s = std::str::from_utf8(bytes).ok()?;
        // The format is "module/invocation/key"
        let mut parts = s.splitn(3, '/');
        let module = parts.next()?;
        let invocation = parts.next()?;
        let key = parts.next()?;
        Some(Self {
            namespace: format!("{}/{}", module, invocation),
            key: key.to_string(),
        })
    }
}

use std::collections::HashMap;

/// A causal-consistency entry stored in the state store.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct StateEntry {
    /// Raw bytes; WASM modules are responsible for their own encoding.
    pub bytes: Vec<u8>,
    /// Vector clock tracking causality. Key is the node ID (base58 String).
    pub vector_clock: HashMap<String, u64>,
    /// Unix timestamp (milliseconds) when this value was last written (used for LWW ties).
    pub last_modified: u64,
}

impl StateEntry {
    /// Merges a remote StateEntry into this local one following Vector Clock rules.
    /// Returns the winning StateEntry, or the LWW resolved merged entry.
    pub fn merge(&self, remote: &StateEntry) -> StateEntry {
        let mut self_dominates = false;
        let mut remote_dominates = false;

        let all_keys: std::collections::HashSet<&String> = self.vector_clock.keys()
            .chain(remote.vector_clock.keys())
            .collect();

        for key in all_keys {
            let self_val = self.vector_clock.get(key).copied().unwrap_or(0);
            let remote_val = remote.vector_clock.get(key).copied().unwrap_or(0);

            if self_val > remote_val {
                self_dominates = true;
            } else if remote_val > self_val {
                remote_dominates = true;
            }
        }

        if self_dominates && !remote_dominates {
            // Local strictly dominates
            self.clone()
        } else if remote_dominates && !self_dominates {
            // Remote strictly dominates
            remote.clone()
        } else if !self_dominates && !remote_dominates {
            // Clocks are identical, use LWW as tie-breaker
            if self.last_modified >= remote.last_modified {
                self.clone()
            } else {
                remote.clone()
            }
        } else {
            // Concurrent conflict
            // Apply LWW tie-breaker
            let mut merged_entry = if self.last_modified >= remote.last_modified {
                self.clone()
            } else {
                remote.clone()
            };

            // Merge the vector clocks to reflect that both histories are now joined
            let mut merged_clock = HashMap::new();
            let keys: std::collections::HashSet<&String> = self.vector_clock.keys()
                .chain(remote.vector_clock.keys())
                .collect();
            for k in keys {
                let sv = self.vector_clock.get(k).copied().unwrap_or(0);
                let rv = remote.vector_clock.get(k).copied().unwrap_or(0);
                merged_clock.insert(k.clone(), std::cmp::max(sv, rv));
            }
            merged_entry.vector_clock = merged_clock;
            
            merged_entry
        }
    }

    /// Checks if this vector clock is concurrent with another (i.e. neither causally dominates).
    /// Two entries are concurrent when each has at least one component that is strictly
    /// greater than the other — neither happened-before the other.
    pub fn is_concurrent(&self, remote: &StateEntry) -> bool {
        let mut self_dominates = false;
        let mut remote_dominates = false;

        let all_keys: std::collections::HashSet<&String> = self.vector_clock.keys()
            .chain(remote.vector_clock.keys())
            .collect();

        for key in all_keys {
            let self_val = self.vector_clock.get(key).copied().unwrap_or(0);
            let remote_val = remote.vector_clock.get(key).copied().unwrap_or(0);

            if self_val > remote_val {
                self_dominates = true;
            } else if remote_val > self_val {
                remote_dominates = true;
            }
        }

        // Concurrent: BOTH sides have at least one dimension where they lead.
        self_dominates && remote_dominates
    }
}

/// Represents a single mutation applied to the state store.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum SyncEvent {
    Put { key: StateKey, value: StateEntry },
    Delete { key: StateKey },
}

/// Summary returned after a sync flush completes.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SyncReport {
    /// Number of `Put` events flushed to the remote backend.
    pub puts: usize,
    /// Number of `Delete` events flushed.
    pub deletes: usize,
    /// Number of events that failed and were re-queued.
    pub failures: usize,
    /// Duration of the flush operation in milliseconds.
    pub duration_ms: u64,
}
