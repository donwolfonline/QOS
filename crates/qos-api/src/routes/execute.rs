use axum::{
    body::Bytes,
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde_json::json;
use tracing::error;

use crate::state::ApiState;

/// POST /api/v1/execute
/// Receives a raw byte payload (either a QR buffer or .qos archive).
/// Routes it to the bootloader pipeline for parsing, validation, and execution.
pub async fn execute_handler(
    State(state): State<ApiState>,
    body: Bytes,
) -> impl IntoResponse {
    let payload = body.to_vec();

    if payload.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "Empty payload provided" })),
        );
    }

    // Try treating it as a .qos package first; if that fails due to magic bytes,
    // fallback to QR code. Actually, the pipeline handles this logically if we 
    // try to determine it. For simplicity, we can attempt package execution, 
    // and if it fails with an obvious format error, fallback to QR. 
    // But realistically, the bootloader pipeline handles these separately.
    // Let's look for gzip magic bytes (0x1f 0x8b) for .qos package.
    
    let is_qos_package = payload.len() >= 2 && payload[0] == 0x1f && payload[1] == 0x8b;

    let result_future = if is_qos_package {
        state.bootloader.execute_package(&payload, &state.execution_engine).await
    } else {
        state.bootloader.execute_qr(&payload, &state.execution_engine).await
    };

    match result_future {
        Ok(res) => (
            StatusCode::OK,
            Json(json!({
                "status": format!("{:?}", res.status),
                "exit_code": res.exit_code,
                "fuel_consumed": res.fuel_consumed,
                "peak_memory_bytes": res.memory.peak_bytes,
                "events_emitted": res.events.len(),
            })),
        ),
        Err(e) => {
            error!("API Execution failed: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": e.to_string() })),
            )
        }
    }
}
