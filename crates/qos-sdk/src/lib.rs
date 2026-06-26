#![no_std]

//! Q-OS Software Development Kit (SDK)
//!
//! This crate provides the abstract Host ABI boundary and secure high-level
//! wrappers for building sandboxed WebAssembly (WASM) modules to run within
//! the Q-OS edge environment.

extern crate alloc;
use alloc::vec::Vec;
use alloc::string::String;

#[global_allocator]
static ALLOCATOR: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

/// Low-level Host ABI boundary.
///
/// These functions form the raw contract between the WASM guest sandbox and
/// the Wasmtime host engine. Calling them directly is unsafe and generally
/// requires manually managing WASM linear memory, pointer passing, and string serialization.
#[link(wasm_import_module = "host")]
extern "C" {
    fn sys_log_telemetry(level: i32, ptr: *const u8, len: usize);
    fn now_ms() -> i64;
    fn sys_state_get(key_ptr: *const u8, key_len: usize, out_ptr: *mut u8, out_max: usize) -> i32;
    fn sys_state_set(key_ptr: *const u8, key_len: usize, val_ptr: *const u8, val_len: usize) -> i32;
    fn sys_network_broadcast(topic_ptr: *const u8, topic_len: usize, payload_ptr: *const u8, payload_len: usize) -> i32;
}

/// Represents the severity level of a telemetry log event.
#[repr(i32)]
pub enum LogLevel {
    /// Error conditions that require immediate attention.
    Error = 0,
    /// Warning conditions that do not halt execution but indicate potential issues.
    Warn = 1,
    /// Informational messages outlining normal operational progress.
    Info = 2,
    /// Detailed debugging information.
    Debug = 3,
}

/// Telemetry logging subsystem.
pub mod log {
    use super::*;

    /// Emits a telemetry log to the host environment.
    ///
    /// This log is piped directly to the host's standard error stream.
    /// 
    /// # Arguments
    ///
    /// * `level` - The severity of the log event.
    /// * `msg` - The textual message to transmit.
    pub fn telemetry(level: LogLevel, msg: &str) {
        unsafe {
            sys_log_telemetry(level as i32, msg.as_ptr(), msg.len());
        }
    }
}

/// System time utilities.
pub mod time {
    /// Returns the current host time in milliseconds since the UNIX epoch.
    pub fn now_ms() -> u64 {
        let ms = unsafe { super::now_ms() };
        if ms < 0 { 0 } else { ms as u64 }
    }
}

/// Sandboxed Key-Value state management.
///
/// All interactions are governed by the module's manifest. Attempting
/// to read or write without the corresponding `state_read` or `state_write`
/// capabilities will trigger an uncatchable security trap in the host engine.
pub mod state {
    use super::*;

    /// Retrieves the byte payload for a specific state key.
    ///
    /// Requires the `state_read` capability.
    ///
    /// # Arguments
    ///
    /// * `key` - The string key to fetch.
    ///
    /// # Returns
    ///
    /// Returns `Some(Vec<u8>)` if the key exists, or `None` if it does not
    /// exist or if a read error occurred.
    pub fn get(key: &str) -> Option<Vec<u8>> {
        let mut buf = [0u8; 4096]; // Max state size for now
        let written = unsafe {
            sys_state_get(key.as_ptr(), key.len(), buf.as_mut_ptr(), buf.len())
        };
        if written < 0 {
            None
        } else if written == 0 {
            None
        } else {
            Some(buf[..written as usize].to_vec())
        }
    }

    /// Stores a byte payload into a specific state key.
    ///
    /// Requires the `state_write` capability. Attempting this without the
    /// capability will cause a hard engine trap.
    ///
    /// # Arguments
    ///
    /// * `key` - The string key to modify.
    /// * `value` - The byte payload to persist.
    ///
    /// # Returns
    ///
    /// Returns `Ok(())` on success, or `Err(())` on an internal serialization error.
    pub fn set(key: &str, value: &[u8]) -> Result<(), ()> {
        let res = unsafe {
            sys_state_set(key.as_ptr(), key.len(), value.as_ptr(), value.len())
        };
        if res < 0 {
            Err(())
        } else {
            Ok(())
        }
    }
}

/// Decentralized network operations.
///
/// Permits the sandboxed module to participate in the local Q-OS peer-to-peer mesh.
pub mod network {
    use super::*;

    /// Broadcasts a topic-based message to the local P2P network.
    ///
    /// Requires the `network` capability. Attempting this without the
    /// capability will cause an uncatchable Wasmtime security trap.
    ///
    /// # Arguments
    ///
    /// * `topic` - The channel or topic name to broadcast over.
    /// * `payload` - The raw byte data to transmit to peers.
    ///
    /// # Returns
    ///
    /// Returns `Ok(())` on a successful host delegation, or `Err(())` if
    /// the host rejected the message format.
    pub fn broadcast(topic: &str, payload: &[u8]) -> Result<(), ()> {
        let res = unsafe {
            sys_network_broadcast(topic.as_ptr(), topic.len(), payload.as_ptr(), payload.len())
        };
        if res < 0 {
            Err(())
        } else {
            Ok(())
        }
    }
}
