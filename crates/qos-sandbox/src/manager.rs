//! Sandbox manager: instantiate and execute WASM modules in isolation.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

use qos_host_abi::{imports::HostData, QosHostContext, register_host_imports};
use qos_state::SledStateStore;
use qos_types::{ModuleDescriptor, QosError};
use uuid::Uuid;
use wasmtime::{Config, Engine, Linker, Module, Store};

use crate::fuel::DEFAULT_FUEL;
use crate::resource::QosResourceLimiter;

/// Per-invocation sandbox configuration.
pub struct SandboxConfig {
    /// CPU fuel budget (roughly = Wasm instructions).
    pub fuel: u64,
    /// Hard wall-clock timeout.
    pub timeout: Duration,
    /// Linear memory ceiling in bytes.
    pub memory_limit_bytes: usize,
}

impl Default for SandboxConfig {
    fn default() -> Self {
        Self {
            fuel: DEFAULT_FUEL,
            timeout: Duration::from_secs(30),
            memory_limit_bytes: 64 * 1024 * 1024,
        }
    }
}

/// The result of a completed sandbox execution.
#[derive(Debug)]
pub struct SandboxHandle {
    pub invocation_id: Uuid,
    pub exit_code: i32,
    pub duration: Duration,
}

/// Host data extended with resource limiter so we can use store.limiter_async-style.
struct StoreData {
    host: HostData,
    limiter: QosResourceLimiter,
}

impl QosHostContext for StoreData {
    fn host_data(&mut self) -> &mut HostData {
        &mut self.host
    }
}

/// The sandbox manager: creates a Wasmtime engine on construction,
/// then executes modules on demand.
pub struct SandboxManager {
    engine: Engine,
    state: Arc<SledStateStore>,
}

impl SandboxManager {
    pub fn new(state: Arc<SledStateStore>) -> Result<Self, QosError> {
        let mut config = Config::new();
        config.consume_fuel(true);
        config.parallel_compilation(true);
        config.epoch_interruption(true);

        let engine = Engine::new(&config)
            .map_err(|e| QosError::Internal(format!("Wasmtime engine init failed: {e}")))?;

        // Global epoch incrementer for wall-clock timeouts.
        let engine_clone = engine.clone();
        std::thread::spawn(move || {
            loop {
                std::thread::sleep(Duration::from_secs(1));
                engine_clone.increment_epoch();
            }
        });

        Ok(Self { engine, state })
    }

    /// Execute a WASM module described by `descriptor` from raw `wasm_bytes`.
    pub fn execute(
        &self,
        descriptor: &ModuleDescriptor,
        wasm_bytes: &[u8],
        config: SandboxConfig,
    ) -> Result<SandboxHandle, QosError> {
        let invocation_id = Uuid::new_v4();
        let start = std::time::Instant::now();

        tracing::info!(
            invocation = %invocation_id,
            entrypoint = %descriptor.entrypoint,
            "sandbox execution starting"
        );

        // ── Compile ──────────────────────────────────────────────────────────
        let module = Module::from_binary(&self.engine, wasm_bytes)
            .map_err(|e| QosError::WasmCompile(e.to_string()))?;

        // ── Build Store ───────────────────────────────────────────────────────
        let store_data = StoreData {
            host: HostData {
                capabilities: descriptor.capabilities.clone(),
                invocation_id: invocation_id.to_string(),
                module_hash: descriptor.sha256.clone(),
                state: Arc::clone(&self.state),
            },
            limiter: QosResourceLimiter {
                memory_limit: config.memory_limit_bytes,
                ..Default::default()
            },
        };

        let mut store = Store::new(&self.engine, store_data);

        // Fuel metering (set_fuel is the v22 API)
        store
            .set_fuel(config.fuel)
            .map_err(|e: anyhow::Error| QosError::Internal(e.to_string()))?;

        // Resource limiter — closure returns &mut dyn ResourceLimiter
        store.limiter(|data: &mut StoreData| &mut data.limiter as &mut dyn wasmtime::ResourceLimiter);

        // Epoch deadline for strict wall-clock timeout
        store.set_epoch_deadline(config.timeout.as_secs());

        let mut linker: Linker<StoreData> = Linker::new(&self.engine);

        register_host_imports(&mut linker, "host")
            .map_err(|e| QosError::WasmInstantiate(format!("Failed to register host imports: {e}")))?;

        // ── Instantiate + call entrypoint ────────────────────────────────────
        let instance = linker
            .instantiate(&mut store, &module)
            .map_err(|e: anyhow::Error| QosError::WasmInstantiate(e.to_string()))?;

        let func = instance
            .get_typed_func::<(), i32>(&mut store, &descriptor.entrypoint)
            .map_err(|e: anyhow::Error| QosError::WasmInstantiate(format!("entrypoint not found: {e}")))?;

        let exit_code = func
            .call(&mut store, ())
            .map_err(|e: anyhow::Error| QosError::WasmTrap(e.to_string()))?;

        let duration = start.elapsed();

        tracing::info!(
            invocation = %invocation_id,
            exit_code,
            duration_ms = duration.as_millis(),
            "sandbox execution complete"
        );

        Ok(SandboxHandle { invocation_id, exit_code, duration })
    }
}


