//! Async WASM fetcher: downloads module bytes and verifies their SHA-256.
//!
//! HTTPS is enforced: non-https URIs are rejected unless the URI scheme is
//! `file://` (local development only).

use qos_crypto::verify_hash;
use qos_types::{ModuleDescriptor, QosError};
use tracing::{debug, info};

/// Maximum permitted WASM binary size: 64 MiB.
const MAX_WASM_BYTES: usize = 64 * 1024 * 1024;

/// Fetches WASM module bytes from the network or local filesystem.
pub struct ModuleFetcher {
    client: reqwest::Client,
}

impl ModuleFetcher {
    pub fn new() -> Self {
        let client = reqwest::Client::builder()
            // Force rustls — no system OpenSSL dependency.
            .use_rustls_tls()
            .build()
            .expect("failed to build HTTP client");
        Self { client }
    }

    /// Expose the underlying HTTP client for fetching manifests.
    pub fn client(&self) -> &reqwest::Client {
        &self.client
    }

    /// Fetch the WASM module described by `descriptor`.
    /// Verifies SHA-256 *before* returning bytes.
    ///
    /// # Errors
    /// - [`QosError::FetchFailed`] on network or I/O error.
    /// - [`QosError::HashMismatch`] if the downloaded bytes don't match `descriptor.sha256`.
    pub async fn fetch(&self, descriptor: &ModuleDescriptor) -> Result<Vec<u8>, QosError> {
        let scheme = descriptor.uri.scheme();

        let bytes = match scheme {
            "https" | "http" => self.fetch_http(descriptor).await?,
            "file" => self.fetch_file(descriptor)?,
            other => {
                return Err(QosError::FetchFailed {
                    url: descriptor.uri.to_string(),
                    status: format!("unsupported scheme: {other}"),
                })
            }
        };

        // ── Integrity check before returning bytes ───────────────────────────
        if !verify_hash(&bytes, &descriptor.sha256) {
            return Err(QosError::HashMismatch {
                expected: descriptor.sha256.clone(),
                actual: qos_crypto::sha256_hex(&bytes),
            });
        }

        info!(
            url = %descriptor.uri,
            bytes = bytes.len(),
            "WASM module fetched and verified"
        );

        Ok(bytes)
    }

    async fn fetch_http(&self, descriptor: &ModuleDescriptor) -> Result<Vec<u8>, QosError> {
        debug!(url = %descriptor.uri, "fetching WASM via HTTP");

        let response = self
            .client
            .get(descriptor.uri.as_str())
            .send()
            .await
            .map_err(|e| QosError::FetchFailed {
                url: descriptor.uri.to_string(),
                status: e.to_string(),
            })?;

        if !response.status().is_success() {
            return Err(QosError::FetchFailed {
                url: descriptor.uri.to_string(),
                status: response.status().to_string(),
            });
        }

        let bytes = response.bytes().await.map_err(|e| QosError::FetchFailed {
            url: descriptor.uri.to_string(),
            status: e.to_string(),
        })?;

        if bytes.len() > MAX_WASM_BYTES {
            return Err(QosError::ResourceExceeded {
                resource: format!(
                    "module size {} exceeds limit {} bytes",
                    bytes.len(),
                    MAX_WASM_BYTES
                ),
            });
        }

        Ok(bytes.to_vec())
    }

    fn fetch_file(&self, descriptor: &ModuleDescriptor) -> Result<Vec<u8>, QosError> {
        let path = descriptor
            .uri
            .to_file_path()
            .map_err(|_| QosError::FetchFailed {
                url: descriptor.uri.to_string(),
                status: "invalid file URI".into(),
            })?;

        debug!(path = %path.display(), "fetching WASM from local file");
        std::fs::read(&path).map_err(QosError::Io)
    }
}

impl Default for ModuleFetcher {
    fn default() -> Self {
        Self::new()
    }
}
