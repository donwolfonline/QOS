use std::sync::Arc;
use tokio::io::{self, AsyncBufReadExt, BufReader};
use tracing::{error, info};

use qos_bootloader::pipeline::BootloaderPipeline;
use qos_engine::engine::ExecutionEngine;
use qos_state::SledStateStore;
use qos_state_sync::engine::StateSyncEngine;

/// The unified environment combining storage, syncing, and WASM execution.
pub struct QosSystemContext {
    pub state_store: Arc<SledStateStore>,
    pub sync_engine: StateSyncEngine,
    pub execution_engine: ExecutionEngine,
    pub bootloader: Arc<BootloaderPipeline>,
}

impl QosSystemContext {
    /// Launches the main interactive loop for the Q-OS node.
    pub async fn run_loop(&self) -> anyhow::Result<()> {
        info!("Q-OS System Context initialized.");
        println!("Type or pipe the path to a .qos package or QR code image:");

        let stdin = io::stdin();
        let mut reader = BufReader::new(stdin).lines();

        while let Some(line) = reader.next_line().await? {
            let path_str = line.trim();
            if path_str.is_empty() {
                continue;
            }

            let path = std::path::Path::new(path_str);
            if !path.exists() {
                error!("File not found: {}", path_str);
                continue;
            }

            let bytes = match std::fs::read(path) {
                Ok(b) => b,
                Err(e) => {
                    error!("Failed to read file {}: {}", path_str, e);
                    continue;
                }
            };

            info!("Triggered module execution via input: {}", path_str);

            let is_qos_package = path_str.ends_with(".qos");
            
            let result_future = if is_qos_package {
                self.bootloader.execute_package(&bytes, &self.execution_engine).await
            } else {
                self.bootloader.execute_qr(&bytes, &self.execution_engine).await
            };

            match result_future {
                Ok(result) => {
                    // Log the structured JSON representation of the final state
                    info!(
                        status = ?result.status,
                        exit_code = result.exit_code,
                        fuel_consumed = result.fuel_consumed,
                        peak_memory_bytes = result.memory.peak_bytes,
                        events_emitted = result.events.len(),
                        "Invocation finished"
                    );
                }
                Err(e) => {
                    error!("Invocation failed: {}", e);
                }
            }
        }

        Ok(())
    }
}
