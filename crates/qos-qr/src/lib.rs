//! # qos-qr
//!
//! QR code decoding for the Q-OS bootloader.
//! Accepts raw image bytes, decodes any QR code present, and returns the
//! decoded payload string for further parsing by the bootloader pipeline.

pub mod decode;

pub use decode::{decode_qr_from_bytes, QrPayload};
