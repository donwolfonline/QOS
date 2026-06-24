//! # qos-state
//!
//! Layer 3: Embedded state store and sync engine.
//!
//! - `SledStateStore` — `sled`-backed KV with namespaced keys.
//! - `TxManager` — optimistic transactions with WAL-based crash safety.
//! - `EvictionManager` — TTL-based namespace cleanup.

pub mod evict;
pub mod store;
pub mod tx;

pub use store::SledStateStore;
pub use tx::TxManager;

/// Trait that all state store implementations must satisfy.
/// The Host ABI and sync adapters depend on this trait, not the concrete type.
pub trait StateStore: Send + Sync {
    fn get(&self, key: &qos_types::StateKey) -> Result<Option<qos_types::StateEntry>, qos_types::QosError>;
    fn set(&self, key: &qos_types::StateKey, value: qos_types::StateEntry) -> Result<(), qos_types::QosError>;
    fn delete(&self, key: &qos_types::StateKey) -> Result<(), qos_types::QosError>;
    fn flush(&self) -> Result<qos_types::SyncReport, qos_types::QosError>;
    fn apply_remote(&self, key: &qos_types::StateKey, value: Option<qos_types::StateEntry>) -> Result<(), qos_types::QosError>;
    fn get_all(&self) -> Result<Vec<(qos_types::StateKey, qos_types::StateEntry)>, qos_types::QosError>;
}
