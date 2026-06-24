//! Manifest parsing and fetching.

use std::collections::HashMap;

use qos_types::QosError;
use serde::{Deserialize, Serialize};
use url::Url;

/// The structure of a `manifest.json` file.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Manifest {
    /// Initial state variables to be injected into the state store
    /// before the module is executed.
    #[serde(default)]
    pub initial_state: HashMap<String, String>,
}

/// Fetch a `manifest.json` from the given URI.
pub async fn fetch_manifest(client: &reqwest::Client, uri: &Url) -> Result<Manifest, QosError> {
    let scheme = uri.scheme();
    match scheme {
        "http" | "https" => {
            let response = client
                .get(uri.as_str())
                .send()
                .await
                .map_err(|e| QosError::FetchFailed {
                    url: uri.to_string(),
                    status: e.to_string(),
                })?;

            if !response.status().is_success() {
                return Err(QosError::FetchFailed {
                    url: uri.to_string(),
                    status: response.status().to_string(),
                });
            }

            let text = response.text().await.map_err(|e| QosError::FetchFailed {
                url: uri.to_string(),
                status: e.to_string(),
            })?;

            serde_json::from_str(&text).map_err(|e| QosError::PayloadParse(e.to_string()))
        }
        "file" => {
            let path = uri.to_file_path().map_err(|_| QosError::FetchFailed {
                url: uri.to_string(),
                status: "invalid file URI".into(),
            })?;
            let content = std::fs::read_to_string(&path).map_err(QosError::Io)?;
            serde_json::from_str(&content).map_err(|e| QosError::PayloadParse(e.to_string()))
        }
        other => Err(QosError::FetchFailed {
            url: uri.to_string(),
            status: format!("unsupported scheme for manifest: {other}"),
        }),
    }
}
