//! Policy rules engine — validates capability claims against runtime policy.

use qos_types::{CapabilitySet, QosError};
use serde::{Deserialize, Serialize};

/// A single named policy rule declaring maximum allowed capabilities.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolicyRule {
    /// Human-readable rule name.
    pub name: String,
    /// The maximum capability set this rule permits.
    pub max_capabilities: CapabilitySet,
    /// Whether Ed25519 signatures are required for modules matched by this rule.
    pub require_signature: bool,
}

/// The policy engine: holds a set of named rules and evaluates
/// incoming `CapabilitySet` requests against them.
#[derive(Debug, Clone)]
pub struct PolicyEngine {
    rules: Vec<PolicyRule>,
    /// If `true`, signature verification is required globally regardless of rules.
    pub strict_mode: bool,
}

impl PolicyEngine {
    pub fn new(rules: Vec<PolicyRule>, strict_mode: bool) -> Self {
        Self { rules, strict_mode }
    }

    /// Returns `Ok(())` if `requested` does not exceed the maximum allowed
    /// capabilities defined by any applicable rule.
    ///
    /// In the current implementation every rule in the list is consulted —
    /// extend this to match rules by URI pattern as needed.
    pub fn validate_capabilities(&self, requested: &CapabilitySet) -> Result<(), QosError> {
        // Use a union of all rule maximums (future: match by URI pattern).
        let allowed = self.rules.iter().fold(CapabilitySet::default(), |mut acc, rule| {
            let m = &rule.max_capabilities;
            acc.network     |= m.network;
            acc.fs_read     |= m.fs_read;
            acc.fs_write    |= m.fs_write;
            acc.gpu         |= m.gpu;
            acc.state_read  |= m.state_read;
            acc.state_write |= m.state_write;
            acc
        });

        macro_rules! check {
            ($cap:ident) => {
                if requested.$cap && !allowed.$cap {
                    return Err(QosError::CapabilityDenied {
                        capability: stringify!($cap).to_string(),
                    });
                }
            };
        }

        check!(network);
        check!(fs_read);
        check!(fs_write);
        check!(gpu);
        check!(state_read);
        check!(state_write);

        Ok(())
    }

    /// Returns `true` if signature verification is required for the current
    /// policy configuration.
    pub fn signature_required(&self) -> bool {
        self.strict_mode || self.rules.iter().any(|r| r.require_signature)
    }
}
