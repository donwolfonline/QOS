//! # qos-cache
//!
//! LRU on-disk WASM bytecode cache keyed by content hash (SHA-256 hex).
//! Prevents re-fetching unchanged modules on repeated QR scans.

pub mod lru;

pub use lru::WasmCache;
