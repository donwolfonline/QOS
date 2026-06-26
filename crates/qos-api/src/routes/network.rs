use axum::{extract::State, Json};
use qos_types::network::NetworkState;
use tracing::error;

use crate::ApiState;

/// Handles network state inspection requests.
/// Returns the live NetworkState of the background Swarm.
pub async fn inspect_handler(State(state): State<ApiState>) -> Json<NetworkState> {
    let network_state = match state.network_state.read() {
        Ok(guard) => guard.clone(),
        Err(e) => {
            error!("Failed to lock network state for reading: {}", e);
            NetworkState::default()
        }
    };
    Json(network_state)
}
