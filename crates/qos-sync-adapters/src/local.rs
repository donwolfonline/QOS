//! Local filesystem sync adapter.
//! Writes a NDJSON event log to a configurable file path.
//! Suitable for air-gapped edge devices or development.

use std::path::PathBuf;
use std::time::Instant;

use async_trait::async_trait;
use qos_types::{QosError, SyncEvent, SyncReport};
use serde_json;
use tokio::io::AsyncWriteExt;
use tracing::debug;

use crate::SyncAdapter;

pub struct LocalAdapter {
    log_path: PathBuf,
}

impl LocalAdapter {
    pub fn new(log_path: PathBuf) -> Self {
        Self { log_path }
    }
}

#[async_trait]
impl SyncAdapter for LocalAdapter {
    async fn push(&self, events: Vec<SyncEvent>) -> Result<SyncReport, QosError> {
        let start = Instant::now();
        let puts = events.iter().filter(|e| matches!(e, SyncEvent::Put { .. })).count();
        let deletes = events.len() - puts;

        let mut file = tokio::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.log_path)
            .await
            .map_err(QosError::Io)?;

        for event in &events {
            let line = serde_json::to_string(event)
                .map_err(|e| QosError::StateSync(e.to_string()))?;
            file.write_all(line.as_bytes()).await.map_err(QosError::Io)?;
            file.write_all(b"\n").await.map_err(QosError::Io)?;
        }

        debug!(path = %self.log_path.display(), events = events.len(), "local sync flush");

        Ok(SyncReport {
            puts,
            deletes,
            failures: 0,
            duration_ms: start.elapsed().as_millis() as u64,
        })
    }
}
