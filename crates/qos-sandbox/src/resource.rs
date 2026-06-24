//! Wasmtime `ResourceLimiter` implementation — enforces memory and table limits.

use wasmtime::ResourceLimiter;

/// Per-invocation resource limits.
pub struct QosResourceLimiter {
    /// Maximum linear memory in bytes.
    pub memory_limit: usize,
    /// Maximum number of Wasm table elements.
    pub table_limit: u32,
}

impl Default for QosResourceLimiter {
    fn default() -> Self {
        Self {
            memory_limit: 64 * 1024 * 1024, // 64 MiB
            table_limit: 4096,
        }
    }
}

impl ResourceLimiter for QosResourceLimiter {
    fn memory_growing(
        &mut self,
        _current: usize,
        desired: usize,
        _maximum: Option<usize>,
    ) -> anyhow::Result<bool> {
        Ok(desired <= self.memory_limit)
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
