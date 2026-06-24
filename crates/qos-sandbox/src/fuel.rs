//! Fuel configuration helpers.
//!
//! Wasmtime's fuel API maps one unit of fuel to roughly one Wasm instruction.
//! These constants are intentionally conservative for edge hardware.

/// Default fuel limit: ~1 billion Wasm instructions per invocation.
pub const DEFAULT_FUEL: u64 = 1_000_000_000;

/// Fuel limit for "light" modules (quick scan processing, etc.).
pub const LIGHT_FUEL: u64 = 10_000_000;

/// Fuel limit for "heavy" modules (data transformation, etc.).
pub const HEAVY_FUEL: u64 = 5_000_000_000;
