//! Bootloader pipeline: QR bytes → `LoadedModule`.
//!
//! # Pipeline stages
//! 1. `qos-qr`     — Decode QR image bytes → `QrPayload`
//! 2. `qos-policy` — Allow-list + capability validation
//! 3. `qos-crypto` — Ed25519 signature verification (if required)
//! 4. `qos-cache`  — Cache hit? Return bytes directly.
//! 5. `qos-fetch`  — Cache miss: fetch + hash-verify bytes
//! 6. `qos-cache`  — Write fetched bytes to cache
//! 7. Emit          — Return `LoadedModule` to Layer 2

use std::sync::Mutex;

use qos_cache::WasmCache;
use qos_crypto::verify_module_signature;
use qos_fetch::ModuleFetcher;
use qos_policy::{PolicyEngine, UriAllowList};
use qos_qr::decode_qr_from_bytes;
use qos_types::{ModuleDescriptor, QosError, StateKey, StateEntry};
use qos_engine::engine::ExecutionEngine;
use qos_engine::context::InvocationResult;
use qos_state::StateStore;
use qos_types::manifest::QosManifest;
use crate::manifest::fetch_manifest;
use uuid::Uuid;
use tracing::{info, instrument, warn};
use url::Url;
use std::io::Read;

/// A fully-verified module ready for sandboxed execution.
pub struct LoadedModule {
    pub descriptor: ModuleDescriptor,
    pub wasm_bytes: Vec<u8>,
}

/// Configuration for the bootloader pipeline.
pub struct BootloaderConfig {
    pub allow_list: UriAllowList,
    pub policy: PolicyEngine,
    pub cache_dir: std::path::PathBuf,
}

/// The main bootloader pipeline.
/// Thread-safe: the cache is wrapped in a `Mutex`.
pub struct BootloaderPipeline {
    allow_list: UriAllowList,
    policy: PolicyEngine,
    fetcher: ModuleFetcher,
    cache: Mutex<WasmCache>,
}

impl BootloaderPipeline {
    pub fn new(config: BootloaderConfig) -> Result<Self, QosError> {
        let cache = WasmCache::new(&config.cache_dir)?;
        Ok(Self {
            allow_list: config.allow_list,
            policy: config.policy,
            fetcher: ModuleFetcher::new(),
            cache: Mutex::new(cache),
        })
    }

    /// Process a raw QR image frame and return a verified [`LoadedModule`].
    #[instrument(skip(self, qr_image_bytes), name = "bootloader_pipeline")]
    pub async fn load_from_qr(&self, qr_image_bytes: &[u8]) -> Result<LoadedModule, QosError> {
        // Stage 1: QR decode
        let payload = decode_qr_from_bytes(qr_image_bytes)?;
        info!(uri = %payload.uri, "QR payload decoded");

        // Stage 2: Build and validate ModuleDescriptor
        let uri = Url::parse(&payload.uri)
            .map_err(|e| QosError::PayloadParse(format!("invalid URI: {e}")))?;

        self.allow_list.check(&uri)?;

        let manifest_uri = match &payload.manifest_uri {
            Some(uri_str) => Some(Url::parse(uri_str).map_err(|e| {
                QosError::PayloadParse(format!("invalid manifest URI: {e}"))
            })?),
            None => None,
        };

        let descriptor = ModuleDescriptor {
            uri: uri.clone(),
            sha256: payload.sha256.clone(),
            signature: payload.signature.clone(),
            signer_pubkey: payload.signer_pubkey.clone(),
            manifest_uri,
            capabilities: payload.capabilities.clone(),
            entrypoint: payload.entrypoint.clone(),
            ttl_secs: payload.ttl_secs,
        };

        self.policy.validate_capabilities(&descriptor.capabilities)?;

        // Stage 3: Signature verification
        if self.policy.signature_required() {
            let sig = descriptor.signature.as_deref().ok_or_else(|| {
                QosError::SignatureInvalid("strict mode requires a signature".into())
            })?;
            let key = descriptor.signer_pubkey.as_deref().ok_or_else(|| {
                QosError::SignatureInvalid("strict mode requires a signer_pubkey".into())
            })?;
            verify_module_signature(descriptor.sha256.as_bytes(), sig, key)?;
            info!("Ed25519 signature verified");
        } else {
            warn!("running without signature verification — not for production use");
        }

        // Stage 4: Cache lookup
        let wasm_bytes = {
            let mut cache = self.cache.lock().unwrap();
            cache.get(&descriptor.sha256)
        };

        let wasm_bytes = match wasm_bytes {
            Some(bytes) => {
                info!(hash = %descriptor.sha256, "WASM cache hit");
                bytes
            }
            None => {
                // Stage 5: Fetch (hash is re-verified inside fetcher)
                let bytes = self.fetcher.fetch(&descriptor).await?;

                // Stage 6: Cache write
                {
                    let mut cache = self.cache.lock().unwrap();
                    let _ = cache.put(&descriptor.sha256, &bytes);
                }

                bytes
            }
        };

        Ok(LoadedModule { descriptor, wasm_bytes })
    }

    /// Process a raw QR image, fetch the manifest (if any), inject initial state,
    /// and immediately execute the WASM module using the provided `ExecutionEngine`.
    #[instrument(skip(self, qr_image_bytes, engine), name = "bootloader_execute_qr")]
    pub async fn execute_qr(
        &self,
        qr_image_bytes: &[u8],
        engine: &ExecutionEngine,
    ) -> Result<InvocationResult, QosError> {
        // 1. Decode, validate, fetch
        let loaded = self.load_from_qr(qr_image_bytes).await?;

        // 2. Fetch manifest and inject state
        let invocation_id = Uuid::new_v4();

        if let Some(manifest_uri) = &loaded.descriptor.manifest_uri {
            info!(uri = %manifest_uri, "fetching manifest");
            let manifest = fetch_manifest(self.fetcher.client(), manifest_uri).await?;

            let now_ms = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_millis() as u64)
                .unwrap_or(0);

            for (key, value) in manifest.initial_state {
                let state_key = StateKey::new(
                    &loaded.descriptor.sha256,
                    &invocation_id.to_string(),
                    &key,
                );
                let state_val = StateEntry {
                    bytes: value.into_bytes(),
                    vector_clock: { let mut m = std::collections::HashMap::new(); m.insert("MANIFEST".to_string(), 1u64); m },
                    last_modified: now_ms,
                };

                engine.state().set(&state_key, state_val).map_err(|e| {
                    QosError::Internal(format!("failed to set initial state: {}", e))
                })?;
            }
            info!("initial state injected from manifest");
        }

        // 3. Execute
        // Since we already generated an invocation ID, ideally the engine would use it.
        // The Engine generates its own Invocation ID currently. To pass the state correctly
        // to the *same* namespace the engine will use, we need the engine to accept
        // an invocation ID, or the engine exposes its generated ID.
        // Wait, engine.run() generates a new Uuid. This means our injected state won't match!
        // We must update engine.run() to accept an optional Uuid, or we pass the invocation_id.
        // Let's modify engine.run() to accept an invocation_id later.
        
        // Actually, for now let's update engine.run() so we can supply it.
        
        let result = engine.run_with_id(invocation_id, &loaded.descriptor, &loaded.wasm_bytes).await;

        Ok(result)
    }

    /// Load and execute a local `.qos` package (tar.gz).
    #[instrument(skip(self, qos_bytes, engine), name = "bootloader_execute_package")]
    pub async fn execute_package(
        &self,
        qos_bytes: &[u8],
        engine: &ExecutionEngine,
    ) -> Result<InvocationResult, QosError> {
        // 1. Unpack archive
        let mut archive = tar::Archive::new(flate2::read::GzDecoder::new(qos_bytes));
        
        let mut manifest: Option<QosManifest> = None;
        let mut wasm_bytes: Option<Vec<u8>> = None;

        for entry in archive.entries().map_err(|e| QosError::Internal(format!("failed to read archive: {e}")))? {
            let mut entry = entry.map_err(|e| QosError::Internal(format!("failed to read entry: {e}")))?;
            let path = entry.path().map_err(|e| QosError::Internal(format!("failed to read entry path: {e}")))?;
            
            if path.ends_with("manifest.json") {
                let mut content = String::new();
                entry.read_to_string(&mut content).map_err(|e| QosError::Internal(format!("failed to read manifest: {e}")))?;
                manifest = Some(serde_json::from_str(&content).map_err(|e| QosError::Internal(format!("invalid manifest JSON: {e}")))?);
            } else if path.ends_with("module.wasm") {
                let mut buf = Vec::new();
                entry.read_to_end(&mut buf).map_err(|e| QosError::Internal(format!("failed to read wasm: {e}")))?;
                wasm_bytes = Some(buf);
            }
        }

        let manifest = manifest.ok_or_else(|| QosError::Internal("archive missing manifest.json".into()))?;
        let wasm_bytes = wasm_bytes.ok_or_else(|| QosError::Internal("archive missing module.wasm".into()))?;

        // 2. Synthesize ModuleDescriptor
        let wasm_hash = qos_crypto::sha256_hex(&wasm_bytes);
        info!(name = %manifest.name, hash = %wasm_hash, "loaded local .qos package");

        let descriptor = ModuleDescriptor {
            uri: Url::parse(&format!("file://local/{}", manifest.name)).unwrap(),
            sha256: wasm_hash.clone(),
            signature: None,
            signer_pubkey: None,
            manifest_uri: None,
            capabilities: manifest.capabilities.clone(),
            entrypoint: manifest.entrypoint.clone(),
            ttl_secs: Some(3600),
        };

        // 3. Validate capabilities strictly against policy
        self.policy.validate_capabilities(&descriptor.capabilities)?;

        // Note: For local .qos packages provided to the CLI, we bypass the signature
        // verification and allow-list because the operator explicitly loaded them from disk.

        // 4. Inject initial state
        let invocation_id = Uuid::new_v4();
        let now_ms = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);

        for (key, value) in manifest.initial_state {
            let state_key = StateKey::new(
                &descriptor.sha256,
                &invocation_id.to_string(),
                &key,
            );
            let state_val = StateEntry {
                bytes: value.into_bytes(),
                vector_clock: { let mut m = std::collections::HashMap::new(); m.insert("MANIFEST".to_string(), 1u64); m },
                last_modified: now_ms,
            };

            engine.state().set(&state_key, state_val).map_err(|e| {
                QosError::Internal(format!("failed to set initial state: {}", e))
            })?;
        }

        // 5. Execute
        let result = engine.run_with_id(invocation_id, &descriptor, &wasm_bytes).await;

        Ok(result)
    }
}
