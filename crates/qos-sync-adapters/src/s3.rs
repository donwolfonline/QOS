//! S3 sync adapter stub.
//! Implement with `aws-sdk-s3` once the sync topology is confirmed (see Q3).

use async_trait::async_trait;
use qos_types::{QosError, SyncEvent, SyncReport};

use crate::SyncAdapter;

pub struct S3Adapter {
    pub bucket: String,
    pub prefix: String,
}

#[async_trait]
impl SyncAdapter for S3Adapter {
    async fn push(&self, events: Vec<SyncEvent>) -> Result<SyncReport, QosError> {
        // TODO: Integrate `aws-sdk-s3` once open question Q3 is resolved.
        tracing::warn!(
            bucket = %self.bucket,
            events = events.len(),
            "S3Adapter::push is a stub — events not persisted"
        );
        Ok(SyncReport { puts: 0, deletes: 0, failures: events.len(), duration_ms: 0 })
    }
}
