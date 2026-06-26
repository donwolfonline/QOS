//! Integration tests for the core execution engine.

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use qos_engine::{
        engine::{EngineConfig, ExecutionEngine},
        event_bus::{EventBus, EventKind},
        context::InvocationStatus,
    };
    use qos_state::SledStateStore;
    use qos_types::{CapabilitySet, ModuleDescriptor};
    use url::Url;

    // ── Minimal WASM binaries ────────────────────────────────────────────────
    //
    // These are hand-assembled WASM binaries used to test specific behaviours
    // without requiring a build toolchain at test time.

    /// `run() -> i32` returning 0.  No imports.
    /// WAT:
    /// (module
    ///   (func (export "run") (result i32) i32.const 0)
    /// )
    const WASM_SUCCESS: &[u8] = &[
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
        0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7f,
        0x03, 0x02, 0x01, 0x00,
        0x07, 0x07, 0x01, 0x03, 0x72, 0x75, 0x6e, 0x00, 0x00,
        0x0a, 0x06, 0x01, 0x04, 0x00, 0x41, 0x00, 0x0b,
    ];

    /// `run() -> i32` returning 42.
    /// WAT:
    /// (module
    ///   (func (export "run") (result i32) i32.const 42)
    /// )
    const WASM_EXIT_42: &[u8] = &[
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
        0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7f,
        0x03, 0x02, 0x01, 0x00,
        0x07, 0x07, 0x01, 0x03, 0x72, 0x75, 0x6e, 0x00, 0x00,
        0x0a, 0x06, 0x01, 0x04, 0x00, 0x41, 0x2a, 0x0b,
    ];

    fn make_descriptor(wasm: &[u8]) -> ModuleDescriptor {
        let sha256 = qos_crypto::sha256_hex(wasm);
        ModuleDescriptor {
            uri: Url::parse("file:///test/module.wasm").unwrap(),
            sha256,
            signature: None,
            signer_pubkey: None,
            manifest_uri: None,
            capabilities: CapabilitySet::default(),
            entrypoint: "run".into(),
            ttl_secs: None,
            requires_license: false,
        }
    }

    fn make_engine(tmp: &tempfile::TempDir) -> ExecutionEngine {
        let state = Arc::new(SledStateStore::open(tmp.path().join("state")).unwrap());
        let bus = EventBus::new();
        ExecutionEngine::new(state, bus, EngineConfig::default()).unwrap()
    }

    // ── Tests ────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn engine_executes_simple_module() {
        let tmp = tempfile::tempdir().unwrap();
        let engine = make_engine(&tmp);
        let desc = make_descriptor(WASM_SUCCESS);
        let result = engine.run(&desc, WASM_SUCCESS).await;
        assert_eq!(result.exit_code, 0);
        assert!(matches!(result.status, InvocationStatus::Success));
    }

    #[tokio::test]
    async fn engine_returns_correct_exit_code() {
        let tmp = tempfile::tempdir().unwrap();
        let engine = make_engine(&tmp);
        let desc = make_descriptor(WASM_EXIT_42);
        let result = engine.run(&desc, WASM_EXIT_42).await;
        assert_eq!(result.exit_code, 42);
        assert!(matches!(result.status, InvocationStatus::Success));
    }

    #[tokio::test]
    async fn engine_tracks_fuel_consumption() {
        let tmp = tempfile::tempdir().unwrap();
        let engine = make_engine(&tmp);
        let desc = make_descriptor(WASM_SUCCESS);
        let result = engine.run(&desc, WASM_SUCCESS).await;
        // The minimal module consumes at least 1 unit of fuel.
        assert!(result.fuel_consumed > 0, "fuel_consumed should be > 0");
    }

    #[tokio::test]
    async fn module_registry_caches_compiled_module() {
        let tmp = tempfile::tempdir().unwrap();
        let engine = make_engine(&tmp);
        let desc = make_descriptor(WASM_SUCCESS);

        // First run: compiles + caches.
        engine.run(&desc, WASM_SUCCESS).await;
        assert_eq!(engine.cached_module_count(), 1);

        // Second run: should be a cache hit (count stays 1).
        engine.run(&desc, WASM_SUCCESS).await;
        assert_eq!(engine.cached_module_count(), 1, "second run should hit cache");
    }

    #[tokio::test]
    async fn evict_removes_module_from_cache() {
        let tmp = tempfile::tempdir().unwrap();
        let engine = make_engine(&tmp);
        let desc = make_descriptor(WASM_SUCCESS);
        engine.run(&desc, WASM_SUCCESS).await;
        assert_eq!(engine.cached_module_count(), 1);
        engine.evict_module(&desc.sha256);
        assert_eq!(engine.cached_module_count(), 0);
    }

    #[tokio::test]
    async fn event_bus_subscriber_count_reflects_subscriptions() {
        let state = Arc::new(SledStateStore::open(tempfile::tempdir().unwrap().path().join("s")).unwrap());
        let bus = EventBus::new();
        assert_eq!(bus.subscriber_count(), 0);
        let _s1 = bus.subscribe();
        let _s2 = bus.subscribe();
        assert_eq!(bus.subscriber_count(), 2);
        let engine = ExecutionEngine::new(state, bus.clone(), EngineConfig::default()).unwrap();
        // Engine's run produces no events on the minimal module — just verify
        // the engine holds a reference to the shared bus.
        let _sub = engine.subscribe();
        assert_eq!(bus.subscriber_count(), 3);
    }

    #[tokio::test]
    async fn invocation_ids_are_unique() {
        let tmp = tempfile::tempdir().unwrap();
        let engine = make_engine(&tmp);
        let desc = make_descriptor(WASM_SUCCESS);
        let r1 = engine.run(&desc, WASM_SUCCESS).await;
        let r2 = engine.run(&desc, WASM_SUCCESS).await;
        assert_ne!(
            r1.invocation_id, r2.invocation_id,
            "each invocation must have a unique ID"
        );
    }

    #[tokio::test]
    async fn memory_stats_are_populated() {
        let tmp = tempfile::tempdir().unwrap();
        let engine = make_engine(&tmp);
        let desc = make_descriptor(WASM_SUCCESS);
        let result = engine.run(&desc, WASM_SUCCESS).await;
        assert_eq!(result.memory.limit_bytes, EngineConfig::default().memory_limit_bytes);
        // Minimal module doesn't grow memory; peak should be 0 or minimal.
        assert!(result.memory.growth_denials == 0);
    }
}
