use axum::{
    body::Body,
    extract::State,
    http::{Request, StatusCode},
    middleware::Next,
    response::Response,
};

use crate::state::ApiState;

/// Middleware that strictly requires an API Key matching the daemon's local token.
pub async fn require_api_key(
    State(state): State<ApiState>,
    req: Request<Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = req.headers().get("X-QOS-API-KEY");

    if let Some(header_value) = auth_header {
        if header_value.to_str().unwrap_or_default() == state.auth_token {
            return Ok(next.run(req).await);
        }
    }

    // Token missing or incorrect
    Err(StatusCode::UNAUTHORIZED)
}
