//! QR code decoding via `rqrr`.
//!
//! # Payload Schema (JSON)
//! The QR code must encode a JSON object of the following shape:
//! ```json
//! {
//!   "uri": "https://modules.example.com/hello.wasm",
//!   "sha256": "abc123...",
//!   "signature": "optional-hex",
//!   "signer_pubkey": "optional-hex",
//!   "manifest_uri": "https://modules.example.com/manifest.json",
//!   "capabilities": {
//!     "network": false,
//!     "fs_read": false,
//!     "fs_write": false,
//!     "gpu": false,
//!     "state_read": true,
//!     "state_write": true
//!   },
//!   "entrypoint": "run",
//!   "ttl_secs": 3600
//! }
//! ```

use image::DynamicImage;
use qos_types::QosError;
use rqrr::PreparedImage;
use serde::{Deserialize, Serialize};

/// The decoded, parsed payload from a Q-OS QR code.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrPayload {
    pub uri: String,
    pub sha256: String,
    pub signature: Option<String>,
    pub signer_pubkey: Option<String>,
    pub manifest_uri: Option<String>,
    pub capabilities: qos_types::CapabilitySet,
    pub entrypoint: String,
    pub ttl_secs: Option<u32>,
}

/// Decode a Q-OS QR payload from raw image bytes (JPEG / PNG / BMP / …).
///
/// # Errors
/// - [`QosError::QrDecode`] if no valid QR code is found in the image.
/// - [`QosError::PayloadParse`] if the QR content is not valid Q-OS JSON.
pub fn decode_qr_from_bytes(image_bytes: &[u8]) -> Result<QrPayload, QosError> {
    let img = image::load_from_memory(image_bytes)
        .map_err(|e| QosError::QrDecode(format!("image load failed: {e}")))?;

    decode_qr_from_image(img)
}

/// Decode from an already-loaded [`DynamicImage`].
pub fn decode_qr_from_image(img: DynamicImage) -> Result<QrPayload, QosError> {
    let luma = img.to_luma8();
    let mut prepared = PreparedImage::prepare(luma);
    let grids = prepared.detect_grids();

    if grids.is_empty() {
        return Err(QosError::QrDecode("no QR code detected in image".into()));
    }

    // Use the first successfully decoded grid.
    for grid in grids {
        match grid.decode() {
            Ok((_meta, content)) => {
                let payload: QrPayload = serde_json::from_str(&content)
                    .map_err(|e| QosError::PayloadParse(format!("JSON decode error: {e}")))?;
                return Ok(payload);
            }
            Err(e) => {
                tracing::warn!("QR grid decode error: {e}");
            }
        }
    }

    Err(QosError::QrDecode("all QR grids failed to decode".into()))
}
