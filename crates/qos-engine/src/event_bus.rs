//! # Event Bus
//!
//! The event bus is the **only** channel through which a sandboxed WASM module
//! can signal state changes back to the host.
//!
//! ## Security design
//! - The WASM module calls `host::emit_event(topic_ptr, topic_len, payload_ptr, payload_len)`.
//! - The Host ABI reads the topic + payload strings from WASM linear memory,
//!   constructs a typed [`EngineEvent`], and publishes it to the bus.
//! - **No host memory pointers are ever exposed to subscribers.**
//! - Subscribers receive a fully-owned `EngineEvent` value; there is no way
//!   for a subscriber to write back into the WASM store.
//!
//! ## Delivery model
//! - Tokio `broadcast` channel — every active subscriber receives every event.
//! - The channel is bounded (capacity = 1024 events); a slow subscriber causes
//!   its lagged messages to be dropped rather than blocking the runtime.
//! - Fire-and-forget: the WASM call to `emit_event` returns immediately
//!   regardless of subscriber backpressure.

use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;
use uuid::Uuid;

/// The channel capacity: how many unread events may queue per subscriber.
const BUS_CAPACITY: usize = 1024;

// ── Event types ──────────────────────────────────────────────────────────────

/// A discriminated event kind.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EventKind {
    /// A module signalled an application-level state change.
    StateChange,
    /// A module completed successfully.
    ExecutionComplete,
    /// A module was terminated (timeout, fuel exhaustion, trap).
    ExecutionFailed,
    /// A module emitted a custom named signal.
    Custom(String),
}

/// A fully-owned, immutable event produced by a sandboxed WASM module.
///
/// This is the value type delivered to all [`EventSubscriber`]s.
/// It contains **no** pointers, handles, or references into WASM memory.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineEvent {
    /// Monotonically increasing event sequence number (per-bus).
    pub seq: u64,
    /// ID of the invocation that produced this event.
    pub invocation_id: Uuid,
    /// SHA-256 hash of the originating module.
    pub module_hash: String,
    /// Structured event kind.
    pub kind: EventKind,
    /// Topic string as emitted by the WASM module (max 256 bytes, validated UTF-8).
    pub topic: String,
    /// Opaque payload (max 64 KiB, raw bytes from WASM linear memory — no pointers).
    pub payload: Vec<u8>,
    /// Host-side timestamp when the event was enqueued (Unix ms).
    pub emitted_at_ms: u64,
}

// ── EventBus ─────────────────────────────────────────────────────────────────

/// A handle to the shared event bus.
/// Clone freely — it is backed by an `Arc<BusInner>`.
#[derive(Clone)]
pub struct EventBus {
    inner: Arc<BusInner>,
}

struct BusInner {
    tx: broadcast::Sender<EngineEvent>,
    /// Atomic sequence counter — incremented for each published event.
    seq: std::sync::atomic::AtomicU64,
}

impl EventBus {
    /// Create a new event bus.
    pub fn new() -> Self {
        let (tx, _) = broadcast::channel(BUS_CAPACITY);
        Self {
            inner: Arc::new(BusInner {
                tx,
                seq: std::sync::atomic::AtomicU64::new(0),
            }),
        }
    }

    /// Publish an [`EngineEvent`] to all current subscribers.
    ///
    /// Returns the number of active receivers that received the message.
    /// A return value of `0` means no subscribers are active (not an error).
    pub fn publish(&self, mut event: EngineEvent) -> usize {
        event.seq = self
            .inner
            .seq
            .fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        match self.inner.tx.send(event) {
            Ok(n) => n,
            // No active receivers — this is fine.
            Err(_) => 0,
        }
    }

    /// Build a typed event and publish it.
    /// Called from the Host ABI when a WASM module calls `host::emit_event`.
    pub fn emit(
        &self,
        invocation_id: Uuid,
        module_hash: &str,
        topic: String,
        payload: Vec<u8>,
    ) -> usize {
        let kind = classify_topic(&topic);
        let emitted_at_ms = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);

        let event = EngineEvent {
            seq: 0, // assigned in publish()
            invocation_id,
            module_hash: module_hash.to_owned(),
            kind,
            topic,
            payload,
            emitted_at_ms,
        };

        self.publish(event)
    }

    /// Subscribe to the event stream.
    ///
    /// The returned [`EventSubscriber`] is a lightweight handle to the broadcast
    /// receiver.  Call `.recv().await` in a tokio task to process events.
    pub fn subscribe(&self) -> EventSubscriber {
        EventSubscriber {
            rx: self.inner.tx.subscribe(),
        }
    }

    /// Return the current number of active subscribers.
    pub fn subscriber_count(&self) -> usize {
        self.inner.tx.receiver_count()
    }
}

impl Default for EventBus {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Debug for EventBus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "EventBus(subscribers={})", self.subscriber_count())
    }
}

// ── EventSubscriber ───────────────────────────────────────────────────────────

/// An active subscription to the event bus.
pub struct EventSubscriber {
    rx: broadcast::Receiver<EngineEvent>,
}

impl EventSubscriber {
    /// Receive the next event.
    ///
    /// Returns `None` if all senders have been dropped (bus shut down).
    /// Lagged events (overflowed buffer) are reported via `Err(Lagged)` from
    /// the underlying channel — this method converts them to `None` with a
    /// warning.
    pub async fn recv(&mut self) -> Option<EngineEvent> {
        loop {
            match self.rx.recv().await {
                Ok(event) => return Some(event),
                Err(broadcast::error::RecvError::Closed) => return None,
                Err(broadcast::error::RecvError::Lagged(n)) => {
                    tracing::warn!(dropped = n, "EventSubscriber lagged — events dropped");
                    // Continue loop to receive the next available event.
                    continue;
                }
            }
        }
    }

    /// Try to receive an event without blocking.
    pub fn try_recv(&mut self) -> Option<EngineEvent> {
        match self.rx.try_recv() {
            Ok(e) => Some(e),
            Err(broadcast::error::TryRecvError::Empty) => None,
            Err(broadcast::error::TryRecvError::Closed) => None,
            Err(broadcast::error::TryRecvError::Lagged(n)) => {
                tracing::warn!(dropped = n, "EventSubscriber lagged on try_recv");
                None
            }
        }
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/// Classify a topic string into a structured [`EventKind`].
/// `pub(crate)` so `engine.rs` can call it directly when building events.
pub(crate) fn classify_topic_pub(topic: &str) -> EventKind {
    classify_topic(topic)
}

/// Classify a topic string into a structured [`EventKind`].
fn classify_topic(topic: &str) -> EventKind {
    match topic {
        "state_change" => EventKind::StateChange,
        "execution_complete" => EventKind::ExecutionComplete,
        "execution_failed" => EventKind::ExecutionFailed,
        other => EventKind::Custom(other.to_owned()),
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn single_subscriber_receives_event() {
        let bus = EventBus::new();
        let mut sub = bus.subscribe();

        let id = Uuid::new_v4();
        bus.emit(id, "aabbcc", "state_change".into(), b"hello".to_vec());

        let event = sub.recv().await.unwrap();
        assert_eq!(event.invocation_id, id);
        assert_eq!(event.kind, EventKind::StateChange);
        assert_eq!(event.payload, b"hello");
    }

    #[tokio::test]
    async fn multiple_subscribers_all_receive() {
        let bus = EventBus::new();
        let mut s1 = bus.subscribe();
        let mut s2 = bus.subscribe();

        let id = Uuid::new_v4();
        bus.emit(id, "hash", "custom_topic".into(), vec![1, 2, 3]);

        let e1 = s1.recv().await.unwrap();
        let e2 = s2.recv().await.unwrap();
        assert_eq!(e1.seq, e2.seq);
        assert!(matches!(e1.kind, EventKind::Custom(_)));
    }

    #[test]
    fn no_subscribers_does_not_panic() {
        let bus = EventBus::new();
        let count = bus.emit(Uuid::new_v4(), "hash", "ping".into(), vec![]);
        assert_eq!(count, 0);
    }
}
