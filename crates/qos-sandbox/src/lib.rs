//! # qos-sandbox
//!
//! Layer 2: Wasmtime-based WASM sandbox manager.
//!
//! Provides strict per-invocation isolation:
//! - Fresh Wasmtime `Store` per execution (no shared state).
//! - Fuel metering for deterministic CPU budgeting.
//! - Wall-clock timeout via tokio `timeout`.
//! - Memory hard-limit enforced by Wasmtime `ResourceLimiter`.

pub mod fuel;
pub mod manager;
pub mod resource;

pub use manager::{SandboxConfig, SandboxHandle, SandboxManager};
