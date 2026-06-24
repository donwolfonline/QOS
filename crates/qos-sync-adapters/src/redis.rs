//! Redis/Valkey sync adapter stub. Implement with the `redis` crate.

use async_trait::async_trait;
use qos_types::{QosError, SyncEvent, SyncReport};
use crate::SyncAdapter;

pub struct RedisAdapter {
    pub url: String,
    pub key_prefix: String,
}

#[async_trait]
impl SyncAdapter for RedisAdapter {
    async fn push(&self, events: Vec<SyncEvent>) -> Result<SyncReport, QosError> {
        tracing::warn!(
            url = %self.url,
            events = events.len(),
            "RedisAdapter::push is a stub"
        );
        Ok(SyncReport { puts: 0, deletes: 0, failures: events.len(), duration_ms: 0 })
    }
}
