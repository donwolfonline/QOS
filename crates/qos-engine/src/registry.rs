//! # Module Registry
//!
//! A thread-safe cache of pre-compiled [`wasmtime::Module`] objects.
//!
//! ## Why cache compiled modules?
//! Wasmtime compiles WASM bytes to native code using Cranelift. This step
//! is CPU-intensive (~10–100 ms for real-world modules). On edge hardware
//! that scans the same QR code repeatedly (e.g. a kiosk), re-compiling on
//! every scan is wasteful.
//!
//! The registry caches the compiled `Module` (which is `Send + Sync` and
//! immutable) keyed by the SHA-256 hash of the source bytes. Different
//! invocations of the same module share the compiled binary; each gets
//! its own fresh `Store` with isolated linear memory.
//!
//! ## Eviction
//! The registry uses an LRU eviction policy capped at `max_entries`.
//! When the cap is reached, the least-recently-used compiled module is
//! dropped. Subsequent requests for that module will trigger a re-compilation.

use std::collections::VecDeque;
use std::sync::{Arc, Mutex};

use thiserror::Error;
use wasmtime::{Engine, Module};

#[derive(Debug, Error)]
pub enum RegistryError {
    #[error("WASM compilation failed for module {hash}: {source}")]
    CompilationFailed {
        hash: String,
        #[source]
        source: anyhow::Error,
    },
}

/// Entry in the registry LRU list.
struct Entry {
    hash: String,
    module: Arc<Module>,
}

/// Inner state of the registry, protected by a `Mutex`.
struct Inner {
    entries: VecDeque<Entry>,
    capacity: usize,
}

impl Inner {
    fn new(capacity: usize) -> Self {
        Self {
            entries: VecDeque::with_capacity(capacity),
            capacity,
        }
    }

    /// Look up by hash.  Touches the entry (moves to back = MRU).
    fn get(&mut self, hash: &str) -> Option<Arc<Module>> {
        if let Some(idx) = self.entries.iter().position(|e| e.hash == hash) {
            let entry = self.entries.remove(idx).unwrap();
            let module = Arc::clone(&entry.module);
            self.entries.push_back(entry);
            return Some(module);
        }
        None
    }

    /// Insert a new compiled module.  Evicts LRU entry if over capacity.
    fn insert(&mut self, hash: String, module: Module) -> Arc<Module> {
        // Evict if at capacity.
        while self.entries.len() >= self.capacity {
            if let Some(evicted) = self.entries.pop_front() {
                tracing::debug!(hash = %evicted.hash, "ModuleRegistry: evicted compiled module");
            }
        }
        let arc = Arc::new(module);
        self.entries.push_back(Entry {
            hash,
            module: Arc::clone(&arc),
        });
        arc
    }

    fn len(&self) -> usize {
        self.entries.len()
    }
}

/// Thread-safe compiled module cache.
#[derive(Clone)]
pub struct ModuleRegistry {
    inner: Arc<Mutex<Inner>>,
    engine: Engine,
}

impl ModuleRegistry {
    /// Create a registry backed by `engine`, caching up to `capacity` modules.
    pub fn new(engine: Engine, capacity: usize) -> Self {
        Self {
            inner: Arc::new(Mutex::new(Inner::new(capacity))),
            engine,
        }
    }

    /// Return a compiled module for `wasm_bytes`.
    ///
    /// - **Cache hit**: returns the shared `Arc<Module>` immediately.
    /// - **Cache miss**: compiles synchronously, caches, returns.
    ///
    /// `hash` must be the SHA-256 hex digest of `wasm_bytes`.
    /// This is not re-verified here — verification must occur in the Bootloader
    /// before bytes reach the registry.
    pub fn get_or_compile(
        &self,
        hash: &str,
        wasm_bytes: &[u8],
    ) -> Result<Arc<Module>, RegistryError> {
        // Fast path: cache hit (lock held briefly).
        {
            let mut guard = self.inner.lock().unwrap();
            if let Some(m) = guard.get(hash) {
                tracing::debug!(hash, "ModuleRegistry: cache hit");
                return Ok(m);
            }
        }

        // Slow path: compile outside the lock.
        tracing::info!(hash, bytes = wasm_bytes.len(), "ModuleRegistry: compiling module");
        let module = Module::from_binary(&self.engine, wasm_bytes).map_err(|e| {
            RegistryError::CompilationFailed {
                hash: hash.to_owned(),
                source: e,
            }
        })?;

        // Re-acquire lock to insert.
        let arc = self.inner.lock().unwrap().insert(hash.to_owned(), module);
        Ok(arc)
    }

    /// Explicitly remove a module from the cache (e.g. after a security revocation).
    pub fn evict(&self, hash: &str) {
        let mut guard = self.inner.lock().unwrap();
        guard.entries.retain(|e| e.hash != hash);
        tracing::info!(hash, "ModuleRegistry: module evicted by request");
    }

    /// Current number of compiled modules in the cache.
    pub fn len(&self) -> usize {
        self.inner.lock().unwrap().len()
    }

    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }

    /// Return a clone of the underlying `Engine` (needed when building `Store`s).
    pub fn engine(&self) -> &Engine {
        &self.engine
    }
}
