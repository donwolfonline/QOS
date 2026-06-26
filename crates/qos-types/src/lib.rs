//! # qos-types
//!
//! Zero-dependency shared type library for Q-OS.
//! Every other crate in the workspace depends on this crate — it must
//! never pull in heavy transitive dependencies.

pub mod descriptor;
pub mod error;
pub mod manifest;
pub mod network;
pub mod sync;

pub use descriptor::{CapabilitySet, ModuleDescriptor};
pub use error::QosError;
pub use manifest::QosManifest;
pub use sync::{StateKey, StateEntry, SyncEvent, SyncReport};
