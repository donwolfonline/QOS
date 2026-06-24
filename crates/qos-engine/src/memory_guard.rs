//! # Memory Guard
//!
//! Per-invocation memory accounting and hard-limit enforcement.
//!
//! ## How memory isolation works in Q-OS
//!
//! Wasmtime already provides the fundamental isolation guarantee:
//! each [`wasmtime::Store`] owns its own **linear memory region** that is
//! separate from every other store.  WASM code cannot address memory outside
//! its own linear space.
//!
//! `MemoryGuard` adds two things on top of that:
//!
//! 1. **Hard ceiling** — once the module requests growth beyond
//!    `limit_bytes`, `memory_growing` returns `false`, which causes the
//!    Wasmtime `memory.grow` instruction to return -1 (spec-compliant OOM).
//!
//! 2. **Instrumentation** — tracks `peak_bytes` so the caller can
//!    include it in `InvocationResult` for observability and capacity
//!    planning.
//!
//! ## Why a separate struct instead of an anonymous closure?
//! `store.limiter()` takes a closure returning `&mut dyn ResourceLimiter`.
//! To also track state (peak bytes), we need a named struct that lives
//! inside `StoreData` for the duration of the invocation.

use wasmtime::ResourceLimiter;

/// Per-invocation memory guard implementing [`ResourceLimiter`].
pub struct MemoryGuard {
    /// Hard limit in bytes.  Growth beyond this is denied.
    pub limit_bytes: usize,
    /// Maximum number of Wasm table elements permitted.
    pub table_limit: u32,
    /// Peak linear memory size observed during this invocation (bytes).
    pub peak_bytes: usize,
    /// Number of times a growth request was denied.
    pub growth_denials: u32,
}

impl MemoryGuard {
    pub fn new(limit_bytes: usize) -> Self {
        Self {
            limit_bytes,
            table_limit: 16_384,
            peak_bytes: 0,
            growth_denials: 0,
        }
    }
}

impl Default for MemoryGuard {
    fn default() -> Self {
        Self::new(64 * 1024 * 1024) // 64 MiB
    }
}

impl ResourceLimiter for MemoryGuard {
    /// Called before every `memory.grow`.
    ///
    /// `current` is the size before growth, `desired` is the size after.
    fn memory_growing(
        &mut self,
        current: usize,
        desired: usize,
        _maximum: Option<usize>,
    ) -> anyhow::Result<bool> {
        if desired > self.limit_bytes {
            self.growth_denials += 1;
            tracing::warn!(
                current,
                desired,
                limit = self.limit_bytes,
                denials = self.growth_denials,
                "MemoryGuard: memory growth denied"
            );
            return Ok(false);
        }
        if desired > self.peak_bytes {
            self.peak_bytes = desired;
        }
        tracing::trace!(current, desired, "MemoryGuard: memory growth allowed");
        Ok(true)
    }

    fn table_growing(
        &mut self,
        _current: u32,
        desired: u32,
        _maximum: Option<u32>,
    ) -> anyhow::Result<bool> {
        Ok(desired <= self.table_limit)
    }
}

/// Snapshot of memory usage captured at the end of an invocation.
#[derive(Debug, Clone)]
pub struct MemoryStats {
    /// Hard limit that was in effect.
    pub limit_bytes: usize,
    /// Peak linear memory observed during the invocation.
    pub peak_bytes: usize,
    /// How many growth requests were denied.
    pub growth_denials: u32,
}

impl From<&MemoryGuard> for MemoryStats {
    fn from(g: &MemoryGuard) -> Self {
        Self {
            limit_bytes: g.limit_bytes,
            peak_bytes: g.peak_bytes,
            growth_denials: g.growth_denials,
        }
    }
}
