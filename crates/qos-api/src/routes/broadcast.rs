use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use crate::ApiState;
use tracing::info;

#[derive(Deserialize)]
pub struct BroadcastPayload {
    pub level: String,
    pub message: String,
}

#[derive(Serialize)]
struct SystemBroadcast {
    #[serde(rename = "type")]
    msg_type: String,
    level: String,
    message: String,
}

/// POST /api/v1/broadcast
pub async fn broadcast_handler(
    State(state): State<ApiState>,
    Json(payload): Json<BroadcastPayload>,
) -> impl IntoResponse {
    // Basic validation of the level
    match payload.level.as_str() {
        "INFO" | "WARNING" | "OFFER" => {}
        _ => return (StatusCode::BAD_REQUEST, "Invalid level. Expected INFO, WARNING, or OFFER.").into_response(),
    }

    let broadcast_msg = SystemBroadcast {
        msg_type: "SYSTEM_BROADCAST".to_string(),
        level: payload.level,
        message: payload.message,
    };

    let json_str = match serde_json::to_string(&broadcast_msg) {
        Ok(s) => s,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, format!("Serialization error: {}", e)).into_response(),
    };

    if let Err(e) = state.tx_telemetry.send(json_str) {
        tracing::warn!("Failed to broadcast message (no receivers?): {}", e);
    } else {
        info!("System broadcast sent: {}", broadcast_msg.message);
    }

    (StatusCode::OK, "Broadcast sent").into_response()
}
