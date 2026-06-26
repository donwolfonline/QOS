use qos_bootloader::pipeline::BootloaderPipeline;
use qos_engine::engine::ExecutionEngine;
use tokio::sync::broadcast;

use std::sync::Arc;

/// Shared application state for all Axum routes.
#[derive(Clone)]
pub struct ApiState {
    pub bootloader: Arc<BootloaderPipeline>,
    pub execution_engine: ExecutionEngine,
    pub auth_token: String,
    pub tx_telemetry: broadcast::Sender<String>,
    pub network_state: Arc<std::sync::RwLock<qos_types::network::NetworkState>>,
}
