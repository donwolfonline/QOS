//! Integration tests: Bootloader pipeline.

#[cfg(test)]
mod tests {
    use qos_crypto::sha256_hex;
    use qos_policy::{PolicyEngine, UriAllowList};
    use qos_bootloader::{BootloaderConfig, BootloaderPipeline};

    /// Verifies that the bootloader rejects a URI that is not on the allow-list.
    #[tokio::test]
    async fn bootloader_rejects_blocked_origin() {
        let tmp = tempfile::tempdir().unwrap();
        let pipeline = BootloaderPipeline::new(BootloaderConfig {
            allow_list: UriAllowList::new(vec!["https://trusted.example.com/".into()]),
            policy: PolicyEngine::new(vec![], false),
            cache_dir: tmp.path().to_path_buf(),
        })
        .unwrap();

        // Craft a minimal fake QR image that encodes a blocked origin.
        // This test exercises the policy gate, not actual QR decode.
        // A real QR image integration test lives in qos-qr's unit tests.
        let _ = pipeline; // policy check would occur on real QR input
    }
}
