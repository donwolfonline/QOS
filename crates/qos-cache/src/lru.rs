//! LRU WASM bytecode cache backed by the local filesystem.
//!
//! Cache entries are stored as files named `<sha256>.wasm` inside a
//! configurable cache directory.  A simple in-memory index (LRU order)
//! limits the number of cached modules; evicted entries are removed from disk.

use qos_types::QosError;
use std::collections::VecDeque;
use std::path::{Path, PathBuf};
use tracing::{debug, info};

/// Maximum number of WASM modules held in the cache simultaneously.
const DEFAULT_CAPACITY: usize = 64;

/// LRU WASM bytecode cache.
pub struct WasmCache {
    dir: PathBuf,
    capacity: usize,
    /// Ordered list of SHA-256 hex keys (most-recently-used at the back).
    order: VecDeque<String>,
}

impl WasmCache {
    /// Create a cache rooted at `dir` with default capacity.
    pub fn new(dir: impl AsRef<Path>) -> Result<Self, QosError> {
        let dir = dir.as_ref().to_path_buf();
        std::fs::create_dir_all(&dir)?;
        Ok(Self {
            dir,
            capacity: DEFAULT_CAPACITY,
            order: VecDeque::new(),
        })
    }

    /// Look up cached WASM bytes by SHA-256 `hash_hex`.
    pub fn get(&mut self, hash_hex: &str) -> Option<Vec<u8>> {
        let path = self.entry_path(hash_hex);
        if !path.exists() {
            return None;
        }
        match std::fs::read(&path) {
            Ok(bytes) => {
                self.touch(hash_hex);
                debug!(hash = hash_hex, "cache hit");
                Some(bytes)
            }
            Err(e) => {
                tracing::warn!(hash = hash_hex, err = %e, "cache read error; treating as miss");
                None
            }
        }
    }

    /// Insert `wasm_bytes` into the cache under `hash_hex`.
    /// Evicts the least-recently-used entry if over capacity.
    pub fn put(&mut self, hash_hex: &str, wasm_bytes: &[u8]) -> Result<(), QosError> {
        let path = self.entry_path(hash_hex);
        std::fs::write(&path, wasm_bytes)?;
        self.touch(hash_hex);
        self.evict_if_needed();
        info!(hash = hash_hex, bytes = wasm_bytes.len(), "cached WASM module");
        Ok(())
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    fn entry_path(&self, hash_hex: &str) -> PathBuf {
        self.dir.join(format!("{hash_hex}.wasm"))
    }

    fn touch(&mut self, hash_hex: &str) {
        self.order.retain(|h| h != hash_hex);
        self.order.push_back(hash_hex.to_owned());
    }

    fn evict_if_needed(&mut self) {
        while self.order.len() > self.capacity {
            if let Some(oldest) = self.order.pop_front() {
                let path = self.entry_path(&oldest);
                let _ = std::fs::remove_file(&path);
                debug!(hash = oldest, "evicted cached WASM module");
            }
        }
    }
}
