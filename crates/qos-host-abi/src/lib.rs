//! # qos-host-abi
//!
//! The *only* bridge between sandboxed WASM code and the host runtime.
//!
//! ## Design invariants
//! - All imports are registered via [`register_host_imports`].
//! - Every import is checked against the module's [`CapabilitySet`] before dispatch.
//! - No import may call back into the WASM sandbox (no re-entrancy).
//! - This crate is the security review boundary: changes here require sign-off.

pub mod capability_gate;
pub mod imports;

pub use imports::{register_host_imports, QosHostContext};
