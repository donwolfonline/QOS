//! Low-level helpers for resolving `ModuleDescriptor` values.
//! Extends the pipeline with file-path convenience loaders (useful in tests).

use qos_types::{ModuleDescriptor, QosError};
use std::path::Path;

/// Load a WASM module directly from a local path, bypassing QR decode.
/// Useful for integration tests and the `qos-cli inject` subcommand.
pub fn load_from_path(path: impl AsRef<Path>, descriptor: ModuleDescriptor) -> Result<Vec<u8>, QosError> {
    let bytes = std::fs::read(path.as_ref())?;
    let actual = qos_crypto::sha256_hex(&bytes);
    if actual != descriptor.sha256 {
        return Err(QosError::HashMismatch {
            expected: descriptor.sha256,
            actual,
        });
    }
    Ok(bytes)
}
