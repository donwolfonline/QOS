//! Unified error type for the Q-OS runtime.

use thiserror::Error;

#[derive(Debug, Error)]
pub enum QosError {
    // ── Bootloader errors ────────────────────────────────────────────────────
    #[error("QR decode failed: {0}")]
    QrDecode(String),

    #[error("Payload parse failed: {0}")]
    PayloadParse(String),

    #[error("URI blocked by policy: {uri}")]
    PolicyDenied { uri: String },

    #[error("Content hash mismatch — expected {expected}, got {actual}")]
    HashMismatch { expected: String, actual: String },

    #[error("Signature verification failed: {0}")]
    SignatureInvalid(String),

    #[error("Module fetch failed ({status}): {url}")]
    FetchFailed { url: String, status: String },

    // ── Sandbox errors ───────────────────────────────────────────────────────
    #[error("WASM compilation failed: {0}")]
    WasmCompile(String),

    #[error("WASM instantiation failed: {0}")]
    WasmInstantiate(String),

    #[error("WASM execution trapped: {0}")]
    WasmTrap(String),

    #[error("Capability denied: module requested '{capability}' but it is not granted")]
    CapabilityDenied { capability: String },

    #[error("Resource limit exceeded: {resource}")]
    ResourceExceeded { resource: String },

    // ── State errors ─────────────────────────────────────────────────────────
    #[error("State store error: {0}")]
    StateStore(String),

    #[error("State sync failed: {0}")]
    StateSync(String),

    // ── Generic ──────────────────────────────────────────────────────────────
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Internal error: {0}")]
    Internal(String),
}
