//! # qos-bootloader
//!
//! Layer 1: QR decode → verify → policy check → fetch → cache → emit.
//!
//! This is the entry point for all module load requests.  It produces a
//! verified [`ModuleDescriptor`] + raw WASM bytes, then hands off to Layer 2.

pub mod loader;
pub mod pipeline;
pub mod manifest;

pub use pipeline::{BootloaderPipeline, BootloaderConfig, LoadedModule};
pub use manifest::{Manifest, fetch_manifest};
