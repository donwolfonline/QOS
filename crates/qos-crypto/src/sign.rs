//! Ed25519 signature verification for WASM module signing.
//!
//! The signer signs the SHA-256 hex digest of the WASM bytes.
//! This file handles *verification only* — private keys never reside in
//! the runtime binary.

use ed25519_dalek::{Signature, VerifyingKey};
use qos_types::QosError;

/// Verify an Ed25519 `signature` over `message` using `pubkey_hex`.
///
/// # Arguments
/// * `message`      – The bytes that were signed (typically the SHA-256 hex digest).
/// * `signature_hex`– Hex-encoded 64-byte Ed25519 signature.
/// * `pubkey_hex`   – Hex-encoded 32-byte Ed25519 public key.
///
/// # Errors
/// Returns [`QosError::SignatureInvalid`] if verification fails for any reason.
pub fn verify_module_signature(
    message: &[u8],
    signature_hex: &str,
    pubkey_hex: &str,
) -> Result<(), QosError> {
    let sig_bytes: [u8; 64] = hex::decode(signature_hex)
        .map_err(|e| QosError::SignatureInvalid(format!("bad signature hex: {e}")))?
        .try_into()
        .map_err(|_| QosError::SignatureInvalid("signature must be 64 bytes".into()))?;

    let key_bytes: [u8; 32] = hex::decode(pubkey_hex)
        .map_err(|e| QosError::SignatureInvalid(format!("bad pubkey hex: {e}")))?
        .try_into()
        .map_err(|_| QosError::SignatureInvalid("public key must be 32 bytes".into()))?;

    let sig = Signature::from_bytes(&sig_bytes);
    let key = VerifyingKey::from_bytes(&key_bytes)
        .map_err(|e| QosError::SignatureInvalid(format!("invalid public key: {e}")))?;

    key.verify_strict(message, &sig)
        .map_err(|e| QosError::SignatureInvalid(format!("verification failed: {e}")))?;

    Ok(())
}
