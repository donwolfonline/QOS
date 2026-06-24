//! Capability gate: checks that a required capability is present before
//! allowing a host function to proceed.

use qos_types::{CapabilitySet, QosError};

/// Guard macro used inside host import implementations.
/// Evaluates to `Err(QosError::CapabilityDenied)` if the capability is absent.
#[macro_export]
macro_rules! require_cap {
    ($caps:expr, $field:ident) => {
        if !$caps.$field {
            return Err($crate::capability_gate::cap_denied(stringify!($field)));
        }
    };
}

/// Construct a [`QosError::CapabilityDenied`] for the named capability.
pub fn cap_denied(capability: &str) -> QosError {
    QosError::CapabilityDenied {
        capability: capability.to_owned(),
    }
}

/// Validate a complete `CapabilitySet` claim against a granted set.
/// Returns an error identifying the first denied capability.
pub fn validate_all(requested: &CapabilitySet, granted: &CapabilitySet) -> Result<(), QosError> {
    macro_rules! chk {
        ($f:ident) => {
            if requested.$f && !granted.$f {
                return Err(cap_denied(stringify!($f)));
            }
        };
    }
    chk!(network);
    chk!(fs_read);
    chk!(fs_write);
    chk!(gpu);
    chk!(state_read);
    chk!(state_write);
    Ok(())
}
