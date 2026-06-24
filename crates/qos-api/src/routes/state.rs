use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use base64::{Engine as _, engine::general_purpose::STANDARD};
use qos_types::StateKey;
use qos_state::StateStore;
use crate::ApiState;

#[derive(Deserialize)]
pub struct DumpQuery {
    pub page: Option<usize>,
    pub limit: Option<usize>,
}

#[derive(Serialize)]
pub struct StateEntryDto {
    pub namespace: String,
    pub key: String,
    pub vector_clock: std::collections::HashMap<String, u64>,
    pub last_modified: u64,
    pub bytes_base64: String,
}

/// GET /api/v1/state/dump
pub async fn dump_handler(
    State(state): State<ApiState>,
    Query(query): Query<DumpQuery>,
) -> impl IntoResponse {
    let page = query.page.unwrap_or(0);
    let limit = query.limit.unwrap_or(50);
    
    let store = state.execution_engine.state();
    
    let all = match store.get_all() {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to read state: {}", e),
            ).into_response();
        }
    };
    
    let skip = page * limit;
    let paginated: Vec<StateEntryDto> = all.into_iter()
        .skip(skip)
        .take(limit)
        .map(|(k, v)| StateEntryDto {
            namespace: k.namespace,
            key: k.key,
            vector_clock: v.vector_clock,
            last_modified: v.last_modified,
            bytes_base64: STANDARD.encode(&v.bytes),
        })
        .collect();
        
    (StatusCode::OK, Json(paginated)).into_response()
}

#[derive(Deserialize)]
pub struct EditPayload {
    pub namespace: String,
    pub key: String,
    pub action: String, // "put" or "delete"
    pub value: Option<String>, // base64 encoded bytes
}

/// POST /api/v1/state/edit
pub async fn edit_handler(
    State(state): State<ApiState>,
    Json(payload): Json<EditPayload>,
) -> impl IntoResponse {
    let store = state.execution_engine.state();
    
    let state_key = StateKey {
        namespace: payload.namespace,
        key: payload.key,
    };
    
    match payload.action.as_str() {
        "put" => {
            let bytes = match STANDARD.decode(payload.value.unwrap_or_default()) {
                Ok(b) => b,
                Err(e) => return (StatusCode::BAD_REQUEST, format!("Invalid base64: {}", e)).into_response(),
            };

            // Seed a single-entry vector clock for API-originated writes.
            let mut vector_clock = std::collections::HashMap::new();
            let now_ms = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64;
            vector_clock.insert("LOCAL_API".to_string(), 1);

            let entry = qos_types::sync::StateEntry {
                bytes,
                vector_clock,
                last_modified: now_ms,
            };

            if let Err(e) = store.set(&state_key, entry) {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to set state: {}", e),
                ).into_response();
            }
        }
        "delete" => {
            if let Err(e) = store.delete(&state_key) {
                return (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to delete state: {}", e)).into_response();
            }
        }
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                "Invalid action, use 'put' or 'delete'".to_string(),
            ).into_response();
        }
    }
    
    (StatusCode::OK, "OK").into_response()
}
