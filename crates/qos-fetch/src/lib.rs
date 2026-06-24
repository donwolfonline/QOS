//! # qos-fetch
//!
//! Asynchronous WASM module fetcher.
//! Downloads a module from a URI and verifies its SHA-256 digest before
//! returning bytes to the bootloader pipeline.

pub mod fetcher;

pub use fetcher::ModuleFetcher;
