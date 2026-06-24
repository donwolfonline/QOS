//! SHA-256 content hashing for WASM module integrity verification.

use sha2::{Digest, Sha256};

/// Compute the SHA-256 digest of `data` and return it as a lowercase hex string.
pub fn sha256_hex(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hex::encode(hasher.finalize())
}

/// Verify that `data` matches the expected `hex_digest`.
/// Returns `true` if they match, `false` otherwise.
pub fn verify_hash(data: &[u8], hex_digest: &str) -> bool {
    sha256_hex(data) == hex_digest.to_lowercase()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn known_vector() {
        // SHA-256 of empty input is the standard NIST vector.
        let digest = sha256_hex(b"");
        assert_eq!(
            digest,
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        );
    }

    #[test]
    fn roundtrip_verify() {
        let data = b"hello, Q-OS";
        let hex = sha256_hex(data);
        assert!(verify_hash(data, &hex));
        assert!(!verify_hash(b"tampered", &hex));
    }
}
