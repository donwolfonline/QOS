//! MQTT sync adapter stub. Implement with `rumqttc` once topology is confirmed.

use async_trait::async_trait;
use qos_types::{QosError, SyncEvent, SyncReport};
use crate::SyncAdapter;

pub struct MqttAdapter {
    pub broker_url: String,
    pub topic_prefix: String,
}

#[async_trait]
impl SyncAdapter for MqttAdapter {
    async fn push(&self, events: Vec<SyncEvent>) -> Result<SyncReport, QosError> {
        tracing::warn!(
            broker = %self.broker_url,
            events = events.len(),
            "MqttAdapter::push is a stub"
        );
        Ok(SyncReport { puts: 0, deletes: 0, failures: events.len(), duration_ms: 0 })
    }
}
