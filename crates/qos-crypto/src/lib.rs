//! # qos-crypto
//!
//! Cryptographic primitives for Q-OS.
//! - SHA-256 content-addressing of WASM modules.
//! - Ed25519 signature verification against a pinned trust root.

pub mod hash;
pub mod sign;

pub use hash::{sha256_hex, verify_hash};
pub use sign::verify_module_signature;
