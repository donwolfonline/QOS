//! Q-OS Manifest schema definition.

use crate::descriptor::CapabilitySet;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// The structure of a `manifest.json` embedded in a `.qos` bundle.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct QosManifest {
    /// Name of the module.
    pub name: String,
    /// Semantic version (e.g. "1.0.0").
    pub version: String,
    /// Author or publisher of the module.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,
    /// Capabilities requested by the module.
    #[serde(default)]
    pub capabilities: CapabilitySet,
    /// WASM module entrypoint function (defaults to "run").
    #[serde(default = "default_entrypoint")]
    pub entrypoint: String,
    /// Dependencies to other Q-OS modules or host plugins.
    #[serde(default)]
    pub dependencies: HashMap<String, String>,
    /// Initial state variables to inject into the state store.
    #[serde(default)]
    pub initial_state: HashMap<String, String>,
}

fn default_entrypoint() -> String {
    "run".to_string()
}
