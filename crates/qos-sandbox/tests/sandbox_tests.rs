//! Integration tests: Sandbox execution.

#[cfg(test)]
mod tests {
    use qos_sandbox::{SandboxConfig, SandboxManager};
    use qos_state::SledStateStore;
    use qos_types::{CapabilitySet, ModuleDescriptor};
    use std::sync::Arc;
    use url::Url;

    /// The minimal "hello world" WASM module in binary form.
    /// Exports `run() -> i32` and returns `0`.
    ///
    /// (WAT source):
    /// (module
    ///   (func (export "run") (result i32) i32.const 0)
    /// )
    const HELLO_WASM: &[u8] = &[
        0x00, 0x61, 0x73, 0x6d, // magic
        0x01, 0x00, 0x00, 0x00, // version
        0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7f, // type section: () -> i32
        0x03, 0x02, 0x01, 0x00, // function section
        0x07, 0x07, 0x01, 0x03, 0x72, 0x75, 0x6e, 0x00, 0x00, // export "run"
        0x0a, 0x06, 0x01, 0x04, 0x00, 0x41, 0x00, 0x0b, // code: i32.const 0
    ];

    #[test]
    fn sandbox_executes_hello_wasm() {
        let tmp = tempfile::tempdir().unwrap();
        let state = Arc::new(SledStateStore::open(tmp.path()).unwrap());
        let sandbox = SandboxManager::new(state).unwrap();

        let descriptor = ModuleDescriptor {
            uri: Url::parse("file:///test/hello.wasm").unwrap(),
            sha256: qos_crypto::sha256_hex(HELLO_WASM),
            signature: None,
            signer_pubkey: None,
            capabilities: CapabilitySet::default(),
            entrypoint: "run".into(),
            ttl_secs: None,
            manifest_uri: None,
        };

        let handle = sandbox
            .execute(&descriptor, HELLO_WASM, SandboxConfig::default())
            .expect("sandbox execution should succeed");

        assert_eq!(handle.exit_code, 0);
    }

    #[test]
    fn sandbox_exhausts_timeout() {
        let infinite_loop_wasm = wat::parse_str(r#"
            (module
              (func (export "run") (result i32)
                loop
                  br 0
                end
                i32.const 0
              )
            )
        "#).unwrap();

        let tmp = tempfile::tempdir().unwrap();
        let state = Arc::new(SledStateStore::open(tmp.path()).unwrap());
        let sandbox = SandboxManager::new(state).unwrap();

        let descriptor = ModuleDescriptor {
            uri: Url::parse("file:///test/loop.wasm").unwrap(),
            sha256: qos_crypto::sha256_hex(&infinite_loop_wasm),
            signature: None,
            signer_pubkey: None,
            capabilities: CapabilitySet::default(),
            entrypoint: "run".into(),
            ttl_secs: None,
            manifest_uri: None,
        };

        // Give it huge fuel but a 1-second wall-clock timeout
        let config = SandboxConfig {
            fuel: 1_000_000_000_000,
            timeout: std::time::Duration::from_secs(1),
            ..Default::default()
        };

        let result = sandbox.execute(&descriptor, &infinite_loop_wasm, config);

        assert!(result.is_err());
        let err_str = result.unwrap_err().to_string();
        println!("Error: {}", err_str);
        assert!(err_str.contains("WASM trapped") || err_str.contains("WASM execution trapped") || err_str.contains("timeout") || err_str.contains("epoch") || err_str.contains("interrupted"));
    }
}
