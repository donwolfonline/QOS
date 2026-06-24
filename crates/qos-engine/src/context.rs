//! # Invocation Context
//!
//! Per-invocation data that travels through the execution pipeline and is
//! returned to the caller as [`InvocationResult`].

use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::event_bus::EngineEvent;
use crate::memory_guard::MemoryStats;

/// Rich result returned after a module invocation completes.
#[derive(Debug)]
pub struct InvocationResult {
    /// Unique ID for this specific execution.
    pub invocation_id: Uuid,
    /// SHA-256 hash of the executed module.
    pub module_hash: String,
    /// The WASM entrypoint function that was called.
    pub entrypoint: String,
    /// Exit code returned by the WASM entrypoint (i32).
    pub exit_code: i32,
    /// Total wall-clock time of the execution.
    pub duration: Duration,
    /// Fuel units consumed during execution.
    pub fuel_consumed: u64,
    /// Memory usage statistics captured from the MemoryGuard.
    pub memory: MemoryStats,
    /// All events emitted by the module during this invocation.
    pub events: Vec<EngineEvent>,
    /// Final status of the invocation.
    pub status: InvocationStatus,
}

/// The terminal status of an invocation.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum InvocationStatus {
    /// The entrypoint returned normally.
    Success,
    /// The WASM module trapped (panic, OOB access, etc.).
    Trapped { reason: String },
    /// Execution was cut short by fuel exhaustion.
    FuelExhausted,
    /// Execution exceeded the wall-clock timeout.
    TimedOut,
    /// An internal engine error occurred before execution could start.
    EngineError { reason: String },
}

/// Builder for [`InvocationResult`] — accumulated during execution.
pub struct InvocationContext {
    pub invocation_id: Uuid,
    pub module_hash: String,
    pub entrypoint: String,
    pub start: Instant,
    pub events: Vec<EngineEvent>,
}

impl InvocationContext {
    pub fn new(invocation_id: Uuid, module_hash: String, entrypoint: String) -> Self {
        Self {
            invocation_id,
            module_hash,
            entrypoint,
            start: Instant::now(),
            events: Vec::new(),
        }
    }

    /// Record an event emitted during this invocation.
    pub fn record_event(&mut self, event: EngineEvent) {
        self.events.push(event);
    }

    /// Finalise into an [`InvocationResult`].
    pub fn finish(
        self,
        exit_code: i32,
        fuel_consumed: u64,
        memory: MemoryStats,
        status: InvocationStatus,
    ) -> InvocationResult {
        InvocationResult {
            invocation_id: self.invocation_id,
            module_hash: self.module_hash,
            entrypoint: self.entrypoint,
            exit_code,
            duration: self.start.elapsed(),
            fuel_consumed,
            memory,
            events: self.events,
            status,
        }
    }
}
