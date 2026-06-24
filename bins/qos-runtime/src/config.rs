//! Runtime TOML configuration schema.

use serde::Deserialize;
use std::path::PathBuf;

#[derive(Debug, Deserialize)]
pub struct RuntimeConfig {
    /// Directories / URIs that modules may be fetched from.
    pub allowed_origins: Vec<String>,

    /// On-disk directory for the WASM bytecode cache.
    pub cache_dir: PathBuf,

    /// On-disk directory for the sled state database.
    pub state_dir: PathBuf,

    /// Path to the NDJSON sync event log (used by LocalAdapter).
    pub sync_log_path: PathBuf,

    /// API authentication token.
    pub api_auth_token: Option<String>,
}

impl Default for RuntimeConfig {
    fn default() -> Self {
        Self {
            allowed_origins: vec![],
            cache_dir: PathBuf::from(".qos-cache"),
            state_dir: PathBuf::from(".qos-state"),
            sync_log_path: PathBuf::from(".qos-sync.log"),
            api_auth_token: None,
        }
    }
}
