//! # ExecutionEngine
//!
//! The central runtime that ties together:
//! - [`ModuleRegistry`] — compiled module cache (compile once, run many)
//! - [`MemoryGuard`] — per-invocation memory isolation + accounting
//! - [`EventBus`] — typed event channel; WASM → host signalling
//! - [`InvocationContext`] — accumulates events + metrics during execution
//!
//! ## Execution lifecycle
//!
//! ```text
//! run(descriptor, wasm_bytes)
//!   │
//!   ├─ 1. Compile / cache lookup via ModuleRegistry
//!   │
//!   ├─ 2. Build fresh Store<EngineStoreData>:
//!   │      ├─ MemoryGuard (hard memory limit, peak tracking)
//!   │      ├─ EventBus handle (for host::emit_event)
//!   │      └─ Capability set (for capability gate)
//!   │
//!   ├─ 3. Register Host ABI imports (Linker):
//!   │      ├─ host::log
//!   │      ├─ host::now_ms
//!   │      ├─ host::state_get       (requires state_read cap)
//!   │      ├─ host::state_set       (requires state_write cap)
//!   │      └─ host::emit_event      (always allowed; sandboxed copy to EventBus)
//!   │
//!   ├─ 4. Instantiate + call entrypoint under fuel + wall-clock timeout
//!   │
//!   ├─ 5. Drain pending events from StoreData → InvocationContext
//!   │
//!   └─ 6. Return InvocationResult
//! ```

use std::sync::Arc;
use std::time::Duration;

use anyhow::anyhow;
use tokio::time::{timeout, Instant};
use tracing::{debug, error, info, instrument, warn};
use uuid::Uuid;
use wasmtime::{Config, Engine, Linker, Store};

use qos_state::{SledStateStore, StateStore};
use qos_types::{CapabilitySet, ModuleDescriptor, QosError, StateKey, StateEntry};

use crate::context::{InvocationContext, InvocationResult, InvocationStatus};
use crate::event_bus::{EngineEvent, EventBus};
use crate::memory_guard::{MemoryGuard, MemoryStats};
use crate::registry::ModuleRegistry;

// ── Configuration ─────────────────────────────────────────────────────────────

/// Configuration for the [`ExecutionEngine`].
#[derive(Debug, Clone)]
pub struct EngineConfig {
    /// Fuel budget per invocation (~1 WASM instruction per unit).
    pub fuel_limit: u64,
    /// Hard wall-clock timeout per invocation.
    pub wall_clock_timeout: Duration,
    /// Hard memory ceiling per invocation.
    pub memory_limit_bytes: usize,
    /// Maximum compiled modules to hold in the module registry.
    pub registry_capacity: usize,
    /// Maximum payload size for a single `host::emit_event` call.
    pub event_payload_max_bytes: usize,
    /// Maximum topic string length for `host::emit_event`.
    pub event_topic_max_bytes: usize,
}

impl Default for EngineConfig {
    fn default() -> Self {
        Self {
            fuel_limit: 15_000,
            wall_clock_timeout: Duration::from_millis(50),
            memory_limit_bytes: 16 * 1024 * 1024, // 16 MiB
            registry_capacity: 64,
            event_payload_max_bytes: 64 * 1024, // 64 KiB
            event_topic_max_bytes: 256,
        }
    }
}

// ── Store data ────────────────────────────────────────────────────────────────

/// All data the host ABI closures may access within a single invocation.
struct EngineStoreData {
    // ── Identity ──────────────────────────────────────────────────────────────
    invocation_id: Uuid,
    module_hash: String,
    capabilities: CapabilitySet,

    // ── Sub-systems ───────────────────────────────────────────────────────────
    state: Arc<SledStateStore>,
    event_bus: EventBus,

    // ── Resource limiter (must live in StoreData for store.limiter()) ─────────
    memory_guard: MemoryGuard,

    // ── Event collection ─────────────────────────────────────────────────────
    /// Events buffered during execution; drained into InvocationContext after.
    pending_events: Vec<EngineEvent>,

    // ── Limits passed through for runtime checks ──────────────────────────────
    event_payload_max_bytes: usize,
    event_topic_max_bytes: usize,
}

// ── ExecutionEngine ───────────────────────────────────────────────────────────

/// The Q-OS core execution engine.
///
/// Designed to be created once and reused across many invocations.
/// `Clone` the engine handle to share it across async tasks.
#[derive(Clone)]
pub struct ExecutionEngine {
    registry: ModuleRegistry,
    state: Arc<SledStateStore>,
    event_bus: EventBus,
    config: Arc<EngineConfig>,
}

impl ExecutionEngine {
    /// Create a new engine.
    pub fn new(
        state: Arc<SledStateStore>,
        event_bus: EventBus,
        config: EngineConfig,
    ) -> Result<Self, QosError> {
        let mut wasm_config = Config::new();
        wasm_config.consume_fuel(true);
        wasm_config.epoch_interruption(true);
        wasm_config.parallel_compilation(true);

        let wasm_engine = Engine::new(&wasm_config)
            .map_err(|e| QosError::Internal(format!("Wasmtime engine init: {e}")))?;

        // Spawn a background thread to tick the epoch every 5ms for tight wall-clock interruption
        let tick_engine = wasm_engine.clone();
        std::thread::spawn(move || loop {
            std::thread::sleep(Duration::from_millis(5));
            tick_engine.increment_epoch();
        });

        let registry = ModuleRegistry::new(wasm_engine, config.registry_capacity);

        Ok(Self {
            registry,
            state,
            event_bus,
            config: Arc::new(config),
        })
    }

    /// Subscribe to the engine's event stream.
    pub fn subscribe(&self) -> crate::event_bus::EventSubscriber {
        self.event_bus.subscribe()
    }

    /// Evict a module from the compiled cache (e.g. after a security revocation).
    pub fn evict_module(&self, hash: &str) {
        self.registry.evict(hash);
    }

    /// Number of compiled modules currently cached.
    /// Return a clone of the underlying `Engine` (needed when building `Store`s).
    pub fn cached_module_count(&self) -> usize {
        self.registry.len()
    }

    /// Access the underlying state store.
    pub fn state(&self) -> &Arc<SledStateStore> {
        &self.state
    }

    // ── Core execution ────────────────────────────────────────────────────────

    /// Execute a WASM module and return a rich [`InvocationResult`].
    ///
    /// This is an `async` function because it applies a wall-clock timeout
    /// via `tokio::time::timeout`.  The actual WASM execution is synchronous
    /// (Wasmtime synchronous API) but wrapped in `tokio::task::spawn_blocking`
    /// so it does not block the async executor.
    pub async fn run(&self, descriptor: &ModuleDescriptor, wasm_bytes: &[u8]) -> InvocationResult {
        self.run_with_id(Uuid::new_v4(), descriptor, wasm_bytes).await
    }

    /// Execute a WASM module with an explicitly provided invocation ID.
    #[instrument(skip(self, descriptor, wasm_bytes), name = "engine_run_with_id")]
    pub async fn run_with_id(
        &self,
        invocation_id: Uuid,
        descriptor: &ModuleDescriptor,
        wasm_bytes: &[u8],
    ) -> InvocationResult {
        let start_time = std::time::Instant::now();
        let ctx = InvocationContext::new(
            invocation_id,
            descriptor.sha256.clone(),
            descriptor.entrypoint.clone(),
        );

        tracing::info!(
            invocation = %invocation_id,
            module = %descriptor.sha256,
            entrypoint = %descriptor.entrypoint,
            "ExecutionEngine: starting invocation"
        );

        // Clone everything we need to move into the blocking task.
        let registry = self.registry.clone();
        let state = Arc::clone(&self.state);
        let event_bus = self.event_bus.clone();
        let config = Arc::clone(&self.config);
        let descriptor = descriptor.clone();
        let wasm_bytes = wasm_bytes.to_vec();

        let task = tokio::task::spawn_blocking(move || {
            run_sync(invocation_id, start_time, &descriptor, &wasm_bytes, registry, state, event_bus, config)
        });

        match timeout(self.config.wall_clock_timeout, task).await {
            Ok(Ok(result)) => result,
            Ok(Err(join_err)) => {
                // spawn_blocking panicked
                ctx.finish(
                    -1,
                    0,
                    MemoryStats { limit_bytes: self.config.memory_limit_bytes, peak_bytes: 0, growth_denials: 0 },
                    InvocationStatus::EngineError { reason: join_err.to_string() },
                )
            }
            Err(_timeout) => {
                tracing::warn!(invocation = %invocation_id, "ExecutionEngine: invocation timed out");
                ctx.finish(
                    -1,
                    0,
                    MemoryStats { limit_bytes: self.config.memory_limit_bytes, peak_bytes: 0, growth_denials: 0 },
                    InvocationStatus::TimedOut,
                )
            }
        }
    }
}

// ── Synchronous execution core ────────────────────────────────────────────────

/// The synchronous execution body — runs inside `spawn_blocking`.
fn run_sync(
    invocation_id: Uuid,
    start_time: std::time::Instant,
    descriptor: &ModuleDescriptor,
    wasm_bytes: &[u8],
    registry: ModuleRegistry,
    state: Arc<SledStateStore>,
    event_bus: EventBus,
    config: Arc<EngineConfig>,
) -> InvocationResult {
    let mut ctx = InvocationContext::new(
        invocation_id,
        descriptor.sha256.clone(),
        descriptor.entrypoint.clone(),
    );

    // ── Step 0: Security & License Checks ─────────────────────────────────────
    if let (Some(sig), Some(pubkey)) = (&descriptor.signature, &descriptor.signer_pubkey) {
        let hash_bytes = match hex::decode(&descriptor.sha256) {
            Ok(b) => b,
            Err(e) => {
                return ctx.finish(
                    -1,
                    0,
                    MemoryStats { limit_bytes: config.memory_limit_bytes, peak_bytes: 0, growth_denials: 0 },
                    InvocationStatus::SecurityViolation { reason: format!("invalid module hash hex: {}", e) },
                );
            }
        };

        if let Err(e) = qos_crypto::verify_module_signature(&hash_bytes, sig, pubkey) {
            return ctx.finish(
                -1,
                0,
                MemoryStats { limit_bytes: config.memory_limit_bytes, peak_bytes: 0, growth_denials: 0 },
                InvocationStatus::SecurityViolation { reason: e.to_string() },
            );
        }
    }

    if descriptor.requires_license {
        let license_key = StateKey::new("system", "licenses", &descriptor.sha256);
        let has_license = match state.get(&license_key) {
            Ok(Some(_)) => true,
            _ => false,
        };

        if !has_license {
            return ctx.finish(
                -1,
                0,
                MemoryStats { limit_bytes: config.memory_limit_bytes, peak_bytes: 0, growth_denials: 0 },
                InvocationStatus::Unlicensed,
            );
        }
    }

    // ── Step 1: Compile / cache lookup ────────────────────────────────────────
    let module = match registry.get_or_compile(&descriptor.sha256, wasm_bytes) {
        Ok(m) => m,
        Err(e) => {
            return ctx.finish(
                -1,
                0,
                MemoryStats { limit_bytes: config.memory_limit_bytes, peak_bytes: 0, growth_denials: 0 },
                InvocationStatus::EngineError { reason: e.to_string() },
            );
        }
    };

    // ── Step 2: Build Store ───────────────────────────────────────────────────
    let store_data = EngineStoreData {
        invocation_id,
        module_hash: descriptor.sha256.clone(),
        capabilities: descriptor.capabilities.clone(),
        state,
        event_bus,
        memory_guard: MemoryGuard::new(config.memory_limit_bytes),
        pending_events: Vec::new(),
        event_payload_max_bytes: config.event_payload_max_bytes,
        event_topic_max_bytes: config.event_topic_max_bytes,
    };

    let mut store = Store::new(registry.engine(), store_data);

    // Fuel
    if let Err(e) = store.set_fuel(15_000) {
        return ctx.finish(
            -1,
            0,
            MemoryStats { limit_bytes: config.memory_limit_bytes, peak_bytes: 0, growth_denials: 0 },
            InvocationStatus::EngineError { reason: format!("set_fuel: {e}") },
        );
    }

    // Epoch deadline (tick every 5ms)
    let ticks = (config.wall_clock_timeout.as_millis() / 5).max(1) as u64;
    store.set_epoch_deadline(ticks);

    // Memory guard (closure returns &mut dyn ResourceLimiter)
    store.limiter(|d: &mut EngineStoreData| &mut d.memory_guard as &mut dyn wasmtime::ResourceLimiter);

    // ── Step 3: Register Host ABI ─────────────────────────────────────────────
    let mut linker: Linker<EngineStoreData> = Linker::new(registry.engine());

    if let Err(e) = register_host_abi(&mut linker) {
        return ctx.finish(
            -1,
            0,
            MemoryStats { limit_bytes: config.memory_limit_bytes, peak_bytes: 0, growth_denials: 0 },
            InvocationStatus::EngineError { reason: format!("linker: {e}") },
        );
    }

    // ── Step 4: Instantiate + execute ─────────────────────────────────────────
    let instance = match linker.instantiate(&mut store, &module) {
        Ok(i) => i,
        Err(e) => {
            return ctx.finish(
                -1,
                0,
                MemoryStats::from(&store.data().memory_guard),
                InvocationStatus::EngineError { reason: format!("instantiate: {e}") },
            );
        }
    };

    let func = match instance.get_typed_func::<(), i32>(&mut store, &descriptor.entrypoint) {
        Ok(f) => f,
        Err(e) => {
            return ctx.finish(
                -1,
                0,
                MemoryStats::from(&store.data().memory_guard),
                InvocationStatus::EngineError { reason: format!("entrypoint '{}' not found: {e}", descriptor.entrypoint) },
            );
        }
    };

    let call_result = func.call(&mut store, ());

    // ── Step 5: Collect metrics + events ──────────────────────────────────────
    let fuel_consumed = {
        let remaining = store.get_fuel().unwrap_or(0);
        15_000u64.saturating_sub(remaining)
    };

    let memory_stats = MemoryStats::from(&store.data().memory_guard);

    // Drain pending events accumulated during the call.
    let pending: Vec<EngineEvent> = std::mem::take(&mut store.data_mut().pending_events);
    for event in pending {
        // Publish to global bus for external subscribers.
        store.data().event_bus.publish(event.clone());
        ctx.record_event(event);
    }

    // ── Step 6: Return result ─────────────────────────────────────────────────
    match call_result {
        Ok(exit_code) => {
            let latency_us = start_time.elapsed().as_micros() as u64;
            tracing::info!(
                invocation = %invocation_id,
                module = %descriptor.sha256,
                exit_code,
                fuel_consumed,
                peak_memory_bytes = memory_stats.peak_bytes,
                events = ctx.events.len(),
                latency_us,
                "ExecutionEngine: invocation complete"
            );
            ctx.finish(exit_code, fuel_consumed, memory_stats, InvocationStatus::Success)
        }
        Err(trap) => {
            let trap_str = trap.to_string();
            let status = if trap_str.contains("fuel") || trap_str.contains("Fuel") {
                tracing::warn!(invocation = %invocation_id, "ExecutionEngine: fuel exhausted");
                InvocationStatus::FuelExhausted
            } else {
                tracing::warn!(invocation = %invocation_id, reason = %trap_str, "ExecutionEngine: trap");
                InvocationStatus::Trapped { reason: trap_str }
            };
            ctx.finish(-1, fuel_consumed, memory_stats, status)
        }
    }
}

// ── Host ABI registration ─────────────────────────────────────────────────────

fn register_host_abi(linker: &mut Linker<EngineStoreData>) -> anyhow::Result<()> {
    // ── host::log ─────────────────────────────────────────────────────────────
    linker.func_wrap(
        "host",
        "log",
        |mut caller: wasmtime::Caller<'_, EngineStoreData>, level: i32, ptr: i32, len: i32| {
            let msg = mem_read_str(&mut caller, ptr, len).unwrap_or_default();
            match level {
                0 => tracing::error!(wasm_log = %msg),
                1 => tracing::warn!(wasm_log = %msg),
                2 => tracing::info!(wasm_log = %msg),
                _ => tracing::debug!(wasm_log = %msg),
            }
        },
    )?;

    // ── host::now_ms ──────────────────────────────────────────────────────────
    linker.func_wrap(
        "host",
        "now_ms",
        |_: wasmtime::Caller<'_, EngineStoreData>| -> i64 {
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_millis() as i64)
                .unwrap_or(-1)
        },
    )?;

    // ── host::state_get ───────────────────────────────────────────────────────
    linker.func_wrap(
        "host",
        "state_get",
        |mut caller: wasmtime::Caller<'_, EngineStoreData>,
         key_ptr: i32,
         key_len: i32,
         out_ptr: i32,
         out_max: i32|
         -> i32 {
            if !caller.data().capabilities.state_read {
                tracing::warn!("host::state_get denied: no state_read capability");
                return -1;
            }
            let key_str = match mem_read_str(&mut caller, key_ptr, key_len) {
                Some(k) => k,
                None => return -1,
            };
            let (mh, inv) = {
                let d = caller.data();
                (d.module_hash.clone(), d.invocation_id.to_string())
            };
            let sk = StateKey::new(&mh, &inv, &key_str);
            match caller.data().state.get(&sk) {
                Ok(Some(v)) => mem_write_bytes(&mut caller, out_ptr, out_max, &v.bytes),
                Ok(None) => 0,
                Err(e) => {
                    tracing::error!(err = %e, "host::state_get store error");
                    -1
                }
            }
        },
    )?;

    // ── host::state_set ───────────────────────────────────────────────────────
    linker.func_wrap(
        "host",
        "state_set",
        |mut caller: wasmtime::Caller<'_, EngineStoreData>,
         key_ptr: i32,
         key_len: i32,
         val_ptr: i32,
         val_len: i32|
         -> i32 {
            if !caller.data().capabilities.state_write {
                tracing::warn!("host::state_set denied: no state_write capability");
                return -1;
            }
            let key_str = match mem_read_str(&mut caller, key_ptr, key_len) {
                Some(k) => k,
                None => return -1,
            };
            let val_bytes = match mem_read_bytes(&mut caller, val_ptr, val_len) {
                Some(b) => b,
                None => return -1,
            };
            let (mh, inv) = {
                let d = caller.data();
                (d.module_hash.clone(), d.invocation_id.to_string())
            };
            let sk = StateKey::new(&mh, &inv, &key_str);
            let now_ms = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_millis() as u64)
                .unwrap_or(0);
            let mut vector_clock = std::collections::HashMap::new();
            vector_clock.insert("LOCAL_ENGINE".to_string(), 1u64);
            let value = StateEntry {
                bytes: val_bytes,
                vector_clock,
                last_modified: now_ms,
            };
            match caller.data().state.set(&sk, value) {
                Ok(_) => 0,
                Err(e) => {
                    tracing::error!(err = %e, "host::state_set store error");
                    -1
                }
            }
        },
    )?;

    // ── host::emit_event ──────────────────────────────────────────────────────
    //
    // Signature: emit_event(topic_ptr: i32, topic_len: i32,
    //                       payload_ptr: i32, payload_len: i32) -> i32
    //
    // Returns: 0 on success, -1 if topic/payload violated size limits.
    //
    // ## Security properties
    // - Topic and payload are **copied** out of WASM linear memory into
    //   owned Rust values before the closure returns.
    // - The `EngineEvent` placed on `pending_events` contains no pointers.
    // - The EventBus is only accessed after the call returns, not during.
    // - Capability-free: any module may signal events (topics/payloads are
    //   opaque to the sandbox; subscribers interpret them, not the runtime).
    linker.func_wrap(
        "host",
        "emit_event",
        |mut caller: wasmtime::Caller<'_, EngineStoreData>,
         topic_ptr: i32,
         topic_len: i32,
         payload_ptr: i32,
         payload_len: i32|
         -> i32 {
            let (topic_max, payload_max) = {
                let d = caller.data();
                (d.event_topic_max_bytes, d.event_payload_max_bytes)
            };

            // Validate sizes before reading memory.
            if topic_len as usize > topic_max {
                tracing::warn!(topic_len, limit = topic_max, "host::emit_event topic too long");
                return -1;
            }
            if payload_len as usize > payload_max {
                tracing::warn!(payload_len, limit = payload_max, "host::emit_event payload too large");
                return -1;
            }

            let topic = match mem_read_str(&mut caller, topic_ptr, topic_len) {
                Some(t) => t,
                None => return -1,
            };
            let payload = match mem_read_bytes(&mut caller, payload_ptr, payload_len) {
                Some(b) => b,
                None => vec![],
            };

            let (invocation_id, module_hash, emitted_at_ms) = {
                let d = caller.data();
                let now = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map(|t| t.as_millis() as u64)
                    .unwrap_or(0);
                (d.invocation_id, d.module_hash.clone(), now)
            };

            let kind = crate::event_bus::classify_topic_pub(&topic);
            let event = EngineEvent {
                seq: 0, // assigned when published
                invocation_id,
                module_hash,
                kind,
                topic: topic.clone(),
                payload,
                emitted_at_ms,
            };

            // Buffer the event — we publish after the call returns.
            caller.data_mut().pending_events.push(event);

            tracing::debug!(topic = %topic, "host::emit_event buffered");
            0
        },
    )?;

    Ok(())
}

// ── Memory access helpers ─────────────────────────────────────────────────────

fn mem_read_bytes(caller: &mut wasmtime::Caller<'_, EngineStoreData>, ptr: i32, len: i32) -> Option<Vec<u8>> {
    if len <= 0 {
        return Some(vec![]);
    }
    let mem = caller.get_export("memory")?.into_memory()?;
    let data = mem.data(caller);
    let start = ptr as usize;
    let end = start.checked_add(len as usize)?;
    Some(data.get(start..end)?.to_vec())
}

fn mem_read_str(caller: &mut wasmtime::Caller<'_, EngineStoreData>, ptr: i32, len: i32) -> Option<String> {
    String::from_utf8(mem_read_bytes(caller, ptr, len)?).ok()
}

fn mem_write_bytes(
    caller: &mut wasmtime::Caller<'_, EngineStoreData>,
    out_ptr: i32,
    out_max: i32,
    bytes: &[u8],
) -> i32 {
    let to_write = bytes.len().min(out_max as usize);
    let bytes_slice = bytes[..to_write].to_vec();
    let mem = match caller.get_export("memory").and_then(|e| e.into_memory()) {
        Some(m) => m,
        None => return -1,
    };
    let data = mem.data_mut(caller);
    let start = out_ptr as usize;
    if start + to_write > data.len() {
        return -1;
    }
    data[start..start + to_write].copy_from_slice(&bytes_slice);
    to_write as i32
}
