//! # qos-engine
//!
//! The **core execution engine** for Q-OS.
//!
//! ## Architecture
//!
//! ```text
//!  ┌──────────────────────────────────────────────────────────────────────┐
//!  │                           ExecutionEngine                            │
//!  │                                                                      │
//!  │  ┌─────────────────┐   ┌──────────────────┐   ┌──────────────────┐  │
//!  │  │  ModuleRegistry │   │  InvocationCtx   │   │    EventBus      │  │
//!  │  │  (compiled cache│   │  (per-run state) │   │  (broadcast ch.) │  │
//!  │  │   keyed by hash)│   │                  │   │                  │  │
//!  │  └────────┬────────┘   └────────┬─────────┘   └────────┬─────────┘  │
//!  │           │                     │                       │            │
//!  │           └──────────── Wasmtime Store ─────────────────┘            │
//!  │                          (fresh per invocation)                      │
//!  │                                                                      │
//!  │  MemoryGuard: hard-limit + peak tracking per Store                   │
//!  └──────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Key invariants
//! - Every invocation runs in a **fresh `Store`** — no shared mutable linear memory.
//! - The **event bus** is the *only* channel through which WASM code communicates
//!   asynchronous signals back to the host; it never exposes host memory pointers.
//! - Compiled [`wasmtime::Module`] objects are **shared** across invocations via
//!   the registry (safe — modules are immutable after compilation).

pub mod engine;
pub mod event_bus;
pub mod memory_guard;
pub mod registry;
pub mod context;

pub use engine::{ExecutionEngine, EngineConfig};
pub use event_bus::{EventBus, EngineEvent, EventKind, EventSubscriber};
pub use context::{InvocationContext, InvocationResult};
pub use registry::ModuleRegistry;
pub use memory_guard::MemoryGuard;
