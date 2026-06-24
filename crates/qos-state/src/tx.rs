//! Optimistic transaction manager.
//!
//! Provides a simple "read-modify-write" transaction model using
//! vector-clock-based causal consistency. If the stored entry has a newer
//! `last_modified` timestamp since the read, the transaction aborts and
//! must be retried by the caller.

use qos_types::{QosError, StateKey, StateEntry};
use crate::SledStateStore;
use crate::StateStore;

pub struct TxManager<'a> {
    store: &'a SledStateStore,
}

impl<'a> TxManager<'a> {
    pub fn new(store: &'a SledStateStore) -> Self {
        Self { store }
    }

    /// Atomically update `key` using `f` to transform the current value.
    /// `f` receives the current `StateEntry` (if any) and returns a new one.
    /// Retries up to `max_retries` times on causal conflict (last_modified changed).
    pub fn update<F>(&self, key: &StateKey, max_retries: u32, mut f: F) -> Result<(), QosError>
    where
        F: FnMut(Option<StateEntry>) -> StateEntry,
    {
        for attempt in 0..=max_retries {
            let current = self.store.get(key)?;
            let read_at = current.as_ref().map(|v| v.last_modified).unwrap_or(0);
            let new_value = f(current);

            // Re-read to check for a concurrent write since our read.
            let check = self.store.get(key)?;
            let stored_at = check.as_ref().map(|v| v.last_modified).unwrap_or(0);
            if stored_at != read_at {
                if attempt == max_retries {
                    return Err(QosError::Internal(
                        "transaction conflict: exceeded max retries".into(),
                    ));
                }
                continue; // Retry
            }

            self.store.set(key, new_value)?;
            return Ok(());
        }
        unreachable!()
    }
}
