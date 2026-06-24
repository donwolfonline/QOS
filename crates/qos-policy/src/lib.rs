//! # qos-policy
//!
//! Runtime policy engine: URI allow-listing and capability validation.
//! Loaded once at startup from the TOML config; evaluated for every QR scan.

pub mod allowlist;
pub mod rules;

pub use allowlist::UriAllowList;
pub use rules::{PolicyEngine, PolicyRule};
