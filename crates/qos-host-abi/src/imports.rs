//! Host ABI import registrations.
//!
//! Every function listed here is the complete, audited set of host calls
//! available to sandboxed WASM modules. No other host surface exists.
//!
//! ## ABI convention
//! All pointers and lengths use `i32` (WASM linear memory addressing).
//! Return values that would be variable-length are written into WASM memory
//! and the byte count returned as `i32`; `-1` signals an error (if handled gracefully)
//! or an uncatchable Wasmtime trap is triggered via `anyhow::bail!`.

use std::sync::Arc;

use anyhow::Result;
use qos_state::SledStateStore;
use qos_types::{CapabilitySet, StateKey, StateEntry};
use wasmtime::{Caller, Linker};

/// Host data carried inside each Wasmtime `Store`.
pub struct HostData {
    pub capabilities: CapabilitySet,
    pub invocation_id: String,
    pub module_hash: String,
    pub state: Arc<SledStateStore>,
}

/// Trait implemented by the generic Wasmtime `Store` state, allowing access to `HostData`.
pub trait QosHostContext {
    fn host_data(&mut self) -> &mut HostData;
}

impl QosHostContext for HostData {
    fn host_data(&mut self) -> &mut HostData {
        self
    }
}

/// Register all Q-OS host imports into a [`Linker`].
///
/// `module` is the WASM import namespace (conventionally `"host"`).
pub fn register_host_imports<T: QosHostContext + Send + 'static>(linker: &mut Linker<T>, module: &str) -> Result<()> {
    // ── host::sys_log_telemetry ──────────────────────────────────────────────
    linker.func_wrap(
        module,
        "sys_log_telemetry",
        |mut caller: Caller<'_, T>, level: i32, ptr: i32, len: i32| -> Result<()> {
            if let Some(msg) = read_wasm_string(&mut caller, ptr, len) {
                match level {
                    0 => tracing::error!(wasm_log = %msg),
                    1 => tracing::warn!(wasm_log = %msg),
                    2 => tracing::info!(wasm_log = %msg),
                    _ => tracing::debug!(wasm_log = %msg),
                }
            }
            Ok(())
        },
    )?;

    // ── host::sys_network_broadcast ─────────────────────────────────────────
    linker.func_wrap(
        module,
        "sys_network_broadcast",
        |mut caller: Caller<'_, T>,
         topic_ptr: i32,
         topic_len: i32,
         payload_ptr: i32,
         payload_len: i32|
         -> Result<i32> {
            tracing::debug!(syscall = "sys_network_broadcast", topic_ptr, topic_len, payload_len);
            
            if !caller.data_mut().host_data().capabilities.network {
                tracing::error!("capability denied: network");
                anyhow::bail!("Security Exception: module attempted 'sys_network_broadcast' but lacks 'network' capability in manifest.");
            }
            
            let topic_str = match read_wasm_string(&mut caller, topic_ptr, topic_len) {
                Some(k) => k,
                None => return Ok(-1),
            };
            
            let payload_bytes = match read_wasm_bytes(&mut caller, payload_ptr, payload_len) {
                Some(b) => b,
                None => return Ok(-1),
            };

            let payload_str = String::from_utf8_lossy(&payload_bytes);
            
            tracing::info!(
                target: "telemetry",
                topic = %topic_str,
                payload = %payload_str,
                "Network broadcast from WASM module"
            );
            
            Ok(0)
        },
    )?;

    // ── host::now_ms ─────────────────────────────────────────────────────────
    linker.func_wrap(module, "now_ms", |_caller: Caller<'_, T>| -> i64 {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis() as i64)
            .unwrap_or(-1);
        tracing::debug!(syscall = "now_ms", result = now);
        now
    })?;

    // ── host::sys_state_get ──────────────────────────────────────────────────
    linker.func_wrap(
        module,
        "sys_state_get",
        |mut caller: Caller<'_, T>,
         key_ptr: i32,
         key_len: i32,
         out_ptr: i32,
         out_max: i32|
         -> Result<i32> {
            tracing::debug!(syscall = "sys_state_get", key_ptr, key_len);
            if !caller.data_mut().host_data().capabilities.state_read {
                tracing::error!("capability denied: state_read");
                anyhow::bail!("Security Exception: module attempted 'sys_state_get' but lacks 'state_read' capability in manifest.");
            }
            let key_str = match read_wasm_string(&mut caller, key_ptr, key_len) {
                Some(k) => k,
                None => return Ok(-1),
            };
            let (module_hash, invocation_id) = {
                let d = caller.data_mut().host_data();
                (d.module_hash.clone(), d.invocation_id.clone())
            };
            let state_key = StateKey::new(&module_hash, &invocation_id, &key_str);
            let result = {
                use qos_state::StateStore;
                caller.data_mut().host_data().state.get(&state_key)
            };
            match result {
                Ok(Some(val)) => Ok(write_wasm_bytes(&mut caller, out_ptr, out_max, &val.bytes)),
                Ok(None) => Ok(0),
                Err(e) => {
                    tracing::error!(err = %e, "sys_state_get failed");
                    Ok(-1)
                }
            }
        },
    )?;

    // ── host::sys_state_set ──────────────────────────────────────────────────
    linker.func_wrap(
        module,
        "sys_state_set",
        |mut caller: Caller<'_, T>,
         key_ptr: i32,
         key_len: i32,
         val_ptr: i32,
         val_len: i32|
         -> Result<i32> {
            tracing::debug!(syscall = "sys_state_set", key_ptr, key_len, val_len);
            if !caller.data_mut().host_data().capabilities.state_write {
                tracing::error!("capability denied: state_write");
                anyhow::bail!("Security Exception: module attempted 'sys_state_set' but lacks 'state_write' capability in manifest.");
            }
            let key_str = match read_wasm_string(&mut caller, key_ptr, key_len) {
                Some(k) => k,
                None => return Ok(-1),
            };
            let val_bytes = match read_wasm_bytes(&mut caller, val_ptr, val_len) {
                Some(b) => b,
                None => return Ok(-1),
            };
            let (module_hash, invocation_id) = {
                let d = caller.data_mut().host_data();
                (d.module_hash.clone(), d.invocation_id.clone())
            };
            let state_key = StateKey::new(&module_hash, &invocation_id, &key_str);
            let now_ms = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_millis() as u64)
                .unwrap_or(0);
            let mut vector_clock = std::collections::HashMap::new();
            vector_clock.insert("LOCAL_ABI".to_string(), 1u64);
            let value = StateEntry {
                bytes: val_bytes,
                vector_clock,
                last_modified: now_ms,
            };
            let result = {
                use qos_state::StateStore;
                caller.data_mut().host_data().state.set(&state_key, value)
            };
            match result {
                Ok(_) => Ok(0),
                Err(e) => {
                    tracing::error!(err = %e, "sys_state_set failed");
                    Ok(-1)
                }
            }
        },
    )?;

    Ok(())
}

// ── Memory helpers ────────────────────────────────────────────────────────────

fn read_wasm_bytes<T: QosHostContext>(caller: &mut Caller<'_, T>, ptr: i32, len: i32) -> Option<Vec<u8>> {
    let mem = caller.get_export("memory")?.into_memory()?;
    let data = mem.data(caller);
    let start = ptr as usize;
    let end = start.checked_add(len as usize)?;
    Some(data.get(start..end)?.to_vec())
}

fn read_wasm_string<T: QosHostContext>(caller: &mut Caller<'_, T>, ptr: i32, len: i32) -> Option<String> {
    String::from_utf8(read_wasm_bytes(caller, ptr, len)?).ok()
}

fn write_wasm_bytes<T: QosHostContext>(
    caller: &mut Caller<'_, T>,
    out_ptr: i32,
    out_max: i32,
    bytes: &[u8],
) -> i32 {
    let to_write = bytes.len().min(out_max as usize);
    let mem = match caller.get_export("memory").and_then(|e| e.into_memory()) {
        Some(m) => m,
        None => return -1,
    };
    let data = mem.data_mut(caller);
    let start = out_ptr as usize;
    if start + to_write > data.len() {
        return -1;
    }
    data[start..start + to_write].copy_from_slice(&bytes[..to_write]);
    to_write as i32
}
