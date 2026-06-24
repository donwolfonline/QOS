//! Integration tests for the bootloader manifest and execution flow.

#[cfg(test)]
mod tests {
    use std::fs;
    use std::sync::Arc;

    use image::Luma;
    use qrcode::QrCode;
    use url::Url;

    use qos_bootloader::{BootloaderConfig, BootloaderPipeline};
    use qos_engine::engine::{EngineConfig, ExecutionEngine};
    use qos_engine::event_bus::EventBus;
    use qos_policy::{PolicyEngine, PolicyRule, UriAllowList};
    use qos_qr::QrPayload;
    use qos_state::{SledStateStore, StateStore};
    use qos_types::{CapabilitySet, StateKey};

    /// `run() -> i32` returning 42.
    const WASM_EXIT_42: &[u8] = &[
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7f,
        0x03, 0x02, 0x01, 0x00, 0x07, 0x07, 0x01, 0x03, 0x72, 0x75, 0x6e, 0x00, 0x00, 0x0a, 0x06,
        0x01, 0x04, 0x00, 0x41, 0x2a, 0x0b,
    ];

    #[tokio::test]
    async fn execute_qr_with_manifest_injects_state() {
        let tmp = tempfile::tempdir().unwrap();

        // 1. Setup WASM file
        let wasm_path = tmp.path().join("module.wasm");
        fs::write(&wasm_path, WASM_EXIT_42).unwrap();
        let wasm_uri = Url::from_file_path(&wasm_path).unwrap();

        // 2. Setup manifest.json file
        let manifest_path = tmp.path().join("manifest.json");
        let manifest_json = r#"{
            "initial_state": {
                "admin_key": "secret123",
                "mode": "production"
            }
        }"#;
        fs::write(&manifest_path, manifest_json).unwrap();
        let manifest_uri = Url::from_file_path(&manifest_path).unwrap();

        // 3. Hash WASM
        let sha256 = qos_crypto::sha256_hex(WASM_EXIT_42);

        // 4. Create QR Payload
        let payload = QrPayload {
            uri: wasm_uri.to_string(),
            sha256: sha256.clone(),
            signature: None,
            signer_pubkey: None,
            manifest_uri: Some(manifest_uri.to_string()),
            capabilities: CapabilitySet {
                state_read: true,
                state_write: true,
                ..Default::default()
            },
            entrypoint: "run".into(),
            ttl_secs: None,
        };
        let payload_json = serde_json::to_string(&payload).unwrap();

        // 5. Generate QR image bytes
        let code = QrCode::new(payload_json.as_bytes()).unwrap();
        let image = code.render::<Luma<u8>>().build();
        let mut qr_bytes = Vec::new();
        let encoder = image::codecs::png::PngEncoder::new(&mut qr_bytes);
        image.write_with_encoder(encoder).unwrap();

        // 6. Setup State & Engine
        let state_dir = tmp.path().join("state");
        let state = Arc::new(SledStateStore::open(&state_dir).unwrap());
        let event_bus = EventBus::new();
        let engine = ExecutionEngine::new(state.clone(), event_bus, EngineConfig::default()).unwrap();

        // 7. Setup Bootloader
        let pipeline = BootloaderPipeline::new(BootloaderConfig {
            allow_list: UriAllowList::new(vec!["file:///".into()]),
            policy: PolicyEngine::new(
                vec![
                    PolicyRule {
                        name: "test".into(),
                        max_capabilities: CapabilitySet {
                            state_read: true,
                            state_write: true,
                            ..Default::default()
                        },
                        require_signature: false,
                    }
                ],
                false,
            ),
            cache_dir: tmp.path().join("cache"),
        })
        .unwrap();

        // 8. Execute QR
        let result = pipeline.execute_qr(&qr_bytes, &engine).await.unwrap();

        // Verify Execution
        assert_eq!(result.exit_code, 42);

        // Verify State Injection
        // We know the invocation ID from the result, we just need the keys.
        let invocation_id = result.invocation_id;
        
        let key1 = StateKey::new(&sha256, &invocation_id.to_string(), "admin_key");
        let val1 = state.get(&key1).unwrap().unwrap();
        assert_eq!(String::from_utf8(val1.bytes).unwrap(), "secret123");

        let key2 = StateKey::new(&sha256, &invocation_id.to_string(), "mode");
        let val2 = state.get(&key2).unwrap().unwrap();
        assert_eq!(String::from_utf8(val2.bytes).unwrap(), "production");
    }
}
