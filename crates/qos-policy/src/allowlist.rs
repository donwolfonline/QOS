//! URI allow-list — the first gate a QR payload must pass.

use qos_types::QosError;
use url::Url;

/// A set of allowed URI prefix patterns.
/// Patterns are matched as exact scheme+host+port prefixes.
#[derive(Debug, Clone)]
pub struct UriAllowList {
    /// Allowed URI prefixes (e.g. `"https://modules.example.com/"`).
    prefixes: Vec<String>,
}

impl UriAllowList {
    /// Create an allow-list from a list of URI prefix strings.
    pub fn new(prefixes: Vec<String>) -> Self {
        Self { prefixes }
    }

    /// Returns `Ok(())` if `uri` matches any allowed prefix,
    /// or `Err(QosError::PolicyDenied)` otherwise.
    pub fn check(&self, uri: &Url) -> Result<(), QosError> {
        let uri_str = uri.as_str();
        if self
            .prefixes
            .iter()
            .any(|prefix| uri_str.starts_with(prefix.as_str()))
        {
            Ok(())
        } else {
            Err(QosError::PolicyDenied {
                uri: uri_str.to_owned(),
            })
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn allows_matching_prefix() {
        let list = UriAllowList::new(vec![
            "https://modules.example.com/".into(),
        ]);
        let ok_url = Url::parse("https://modules.example.com/hello.wasm").unwrap();
        assert!(list.check(&ok_url).is_ok());
    }

    #[test]
    fn blocks_foreign_origin() {
        let list = UriAllowList::new(vec!["https://modules.example.com/".into()]);
        let bad_url = Url::parse("https://evil.example.net/malware.wasm").unwrap();
        assert!(list.check(&bad_url).is_err());
    }
}
