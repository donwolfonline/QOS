pub mod auth;
pub mod routes;
pub mod state;
pub mod telemetry;

use axum::{
    middleware,
    routing::{get, post},
    Router,
};
use axum::http::{HeaderValue, Method};
use tower_http::cors::CorsLayer;
use tracing::info;

pub use state::ApiState;
pub use telemetry::BroadcastWriter;

/// Starts the Q-OS Async API Bridge.
/// Binds to 127.0.0.1:3000 locally.
pub async fn start_server(state: ApiState) -> anyhow::Result<()> {
    let cors = CorsLayer::new()
        .allow_origin([
            "http://localhost:3000".parse::<HeaderValue>().unwrap(),
            "http://127.0.0.1:3000".parse::<HeaderValue>().unwrap(),
            "http://localhost:8081".parse::<HeaderValue>().unwrap(),
        ])
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([
            "x-qos-api-key".parse::<axum::http::header::HeaderName>().unwrap(),
            axum::http::header::CONTENT_TYPE,
            axum::http::header::AUTHORIZATION,
        ]);

    let api_routes = Router::new()
        .route("/api/v1/execute", post(routes::execute::execute_handler))
        .route("/api/v1/state/dump", get(routes::state::dump_handler))
        .route("/api/v1/state/edit", post(routes::state::edit_handler))
        .route("/api/v1/broadcast", post(routes::broadcast::broadcast_handler))
        .layer(middleware::from_fn_with_state(state.clone(), auth::require_api_key));

    let debug_routes = Router::new()
        .route("/api/v1/network/inspect", get(routes::network::inspect_handler))
        .route("/api/v1/network/topology", get(routes::network::inspect_handler))
        .with_state(state.clone());

    let app = Router::new()
        .nest("/", api_routes)
        .nest("/", debug_routes)
        .route("/api/v1/stream", get(routes::stream::ws_handler))
        .fallback(get(routes::static_files::static_handler))
        .layer(cors)
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await?;
    info!("qos-api bridge listening on 127.0.0.1:3000");

    axum::serve(listener, app).await?;
    Ok(())
}
