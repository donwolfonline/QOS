use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Query, State,
    },
    http::StatusCode,
    response::IntoResponse,
};
use serde::Deserialize;
use futures::{sink::SinkExt, stream::StreamExt};
use tracing::error;

use crate::state::ApiState;

#[derive(Deserialize)]
pub struct AuthQuery {
    pub token: Option<String>,
}

/// GET /api/v1/stream
/// Upgrades to a WebSocket and streams real-time NDJSON telemetry logs.
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Query(query): Query<AuthQuery>,
    State(state): State<ApiState>,
) -> Result<impl IntoResponse, StatusCode> {
    // Fallback to query-parameter authentication for browser WebSocket APIs
    let is_authorized = match query.token {
        Some(token) => token == state.auth_token,
        None => false,
    };

    if !is_authorized {
        return Err(StatusCode::UNAUTHORIZED);
    }

    Ok(ws.on_upgrade(move |socket| handle_socket(socket, state)))
}

async fn handle_socket(socket: WebSocket, state: ApiState) {
    let mut rx = state.tx_telemetry.subscribe();
    let (mut sender, mut _receiver) = socket.split();

    // Stream logs as they come in from the broadcast channel.
    while let Ok(msg) = rx.recv().await {
        if sender.send(Message::Text(msg)).await.is_err() {
            // Client disconnected
            break;
        }
    }
}
