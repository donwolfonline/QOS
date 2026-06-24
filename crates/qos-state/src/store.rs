//! `sled`-backed state store implementation.

use qos_types::{QosError, StateKey, StateEntry, SyncReport};
use serde_json;
use tracing::{debug, warn};

/// A `sled`-backed state store.
/// All keys are serialised as UTF-8 strings; values are JSON-encoded `StateValue`.
pub struct SledStateStore {
    db: sled::Db,
    /// Pending sync events collected since the last `flush()`.
    pending: std::sync::Mutex<Vec<qos_types::SyncEvent>>,
    /// Broadcaster for local mutations.
    tx: tokio::sync::broadcast::Sender<qos_types::SyncEvent>,
}

impl SledStateStore {
    pub fn open(path: impl AsRef<std::path::Path>) -> Result<Self, QosError> {
        let db = sled::open(path).map_err(|e| QosError::StateStore(e.to_string()))?;
        let (tx, _rx) = tokio::sync::broadcast::channel(1024);
        Ok(Self {
            db,
            pending: std::sync::Mutex::new(Vec::new()),
            tx,
        })
    }

    /// Subscribes to local database mutations (excluding remote syncing mutations).
    pub fn subscribe(&self) -> tokio::sync::broadcast::Receiver<qos_types::SyncEvent> {
        self.tx.subscribe()
    }

    /// Exposes a direct subscriber to all underlying sled database events (both local and remote).
    pub fn watch_all(&self) -> sled::Subscriber {
        self.db.watch_prefix(vec![])
    }
}

impl crate::StateStore for SledStateStore {
    fn get(&self, key: &StateKey) -> Result<Option<StateEntry>, QosError> {
        let raw_key = key.to_bytes();
        match self.db.get(&raw_key).map_err(|e| QosError::StateStore(e.to_string()))? {
            Some(bytes) => {
                let value: StateEntry = serde_json::from_slice(&bytes)
                    .map_err(|e| QosError::StateStore(format!("deserialise error: {e}")))?;
                debug!(key = ?key.key, "state get hit");
                Ok(Some(value))
            }
            None => Ok(None),
        }
    }

    fn set(&self, key: &StateKey, value: StateEntry) -> Result<(), QosError> {
        let raw_key = key.to_bytes();
        let encoded = serde_json::to_vec(&value)
            .map_err(|e| QosError::StateStore(format!("serialise error: {e}")))?;
        self.db
            .insert(raw_key, encoded)
            .map_err(|e| QosError::StateStore(e.to_string()))?;
        let event = qos_types::SyncEvent::Put { key: key.clone(), value: value.clone() };
        self.pending
            .lock()
            .unwrap()
            .push(event.clone());
        let _ = self.tx.send(event); // Ignore if no subscribers
        Ok(())
    }

    fn delete(&self, key: &StateKey) -> Result<(), QosError> {
        let raw_key = key.to_bytes();
        self.db
            .remove(raw_key)
            .map_err(|e| QosError::StateStore(e.to_string()))?;
        let event = qos_types::SyncEvent::Delete { key: key.clone() };
        self.pending
            .lock()
            .unwrap()
            .push(event.clone());
        let _ = self.tx.send(event); // Ignore if no subscribers
        Ok(())
    }

    fn flush(&self) -> Result<SyncReport, QosError> {
        let start = std::time::Instant::now();
        self.db.flush().map_err(|e| QosError::StateStore(e.to_string()))?;
        let events: Vec<_> = self.pending.lock().unwrap().drain(..).collect();
        let puts = events.iter().filter(|e| matches!(e, qos_types::SyncEvent::Put { .. })).count();
        let deletes = events.len() - puts;
        Ok(SyncReport {
            puts,
            deletes,
            failures: 0,
            duration_ms: start.elapsed().as_millis() as u64,
        })
    }

    fn apply_remote(&self, key: &StateKey, value: Option<StateEntry>) -> Result<(), QosError> {
        let raw_key = key.to_bytes();
        if let Some(val) = value {
            let encoded = serde_json::to_vec(&val)
                .map_err(|e| QosError::StateStore(format!("serialise error: {e}")))?;
            self.db
                .insert(raw_key, encoded)
                .map_err(|e| QosError::StateStore(e.to_string()))?;
        } else {
            self.db
                .remove(raw_key)
                .map_err(|e| QosError::StateStore(e.to_string()))?;
        }
        Ok(())
    }

    fn get_all(&self) -> Result<Vec<(StateKey, StateEntry)>, QosError> {
        let mut results = Vec::new();
        for item in self.db.iter() {
            let (raw_key, raw_val) = item.map_err(|e| QosError::StateStore(e.to_string()))?;
            if let Some(key) = StateKey::from_bytes(&raw_key) {
                if let Ok(value) = serde_json::from_slice::<StateEntry>(&raw_val) {
                    results.push((key, value));
                }
            }
        }
        Ok(results)
    }
}
