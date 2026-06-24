//! Module descriptor and capability types.

use serde::{Deserialize, Serialize};
use url::Url;

/// Capabilities a WASM module may request.
/// Every field defaults to `false` (deny-by-default).
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct CapabilitySet {
    /// May make outbound HTTP requests.
    pub network: bool,
    /// May read from the host file-system (sandboxed path).
    pub fs_read: bool,
    /// May write to the host file-system (sandboxed path).
    pub fs_write: bool,
    /// May access GPU / display surfaces.
    pub gpu: bool,
    /// May read from the Q-OS state store.
    pub state_read: bool,
    /// May write to the Q-OS state store.
    pub state_write: bool,
}

/// A fully-resolved, verified module descriptor produced by the Bootloader.
/// This value is the handoff contract between Layer 1 and Layer 2.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleDescriptor {
    /// Canonical source URI for the WASM module.
    pub uri: Url,

    /// Expected SHA-256 digest of the raw WASM bytes (hex-encoded).
    pub sha256: String,

    /// Optional Ed25519 signature over `sha256` (hex-encoded).
    /// Required when the runtime is started with `--strict`.
    pub signature: Option<String>,

    /// Signer's Ed25519 public key (hex-encoded).
    pub signer_pubkey: Option<String>,

    /// Optional URI to fetch a manifest.json containing initial state variables.
    pub manifest_uri: Option<Url>,

    /// Capabilities granted to this module.
    pub capabilities: CapabilitySet,

    /// Name of the exported WASM function to call as the entrypoint.
    pub entrypoint: String,

    /// How long (seconds) the compiled module may remain in the cache.
    pub ttl_secs: Option<u32>,
}
