//! # qos-sync-adapters
//!
//! Pluggable backends for the State Sync Engine.
//!
//! All adapters implement [`SyncAdapter`] — a single async `push` method that
//! receives a batch of [`SyncEvent`]s and delivers them to the backend.
//!
//! ## Provided adapters
//! | Module | Backend | Notes |
//! |--------|---------|-------|
//! `local`  | Filesystem JSON log | Default; zero network deps |
//! `s3`     | AWS S3 / R2 | `stub` — implement with `aws-sdk-s3` |
//! `mqtt`   | MQTT broker | `stub` — implement with `rumqttc` |
//! `redis`  | Redis / Valkey | `stub` — implement with `redis` crate |

pub mod local;
pub mod mqtt;
pub mod redis;
pub mod s3;

use async_trait::async_trait;
use qos_types::{QosError, SyncEvent, SyncReport};

#[async_trait]
pub trait SyncAdapter: Send + Sync {
    async fn push(&self, events: Vec<SyncEvent>) -> Result<SyncReport, QosError>;
}
