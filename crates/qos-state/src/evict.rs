//! TTL-based namespace eviction.
//!
//! Scans the sled database for entries whose `last_modified` plus
//! `ttl_ms` is older than `now`, and removes them.

use qos_types::StateEntry;
use serde_json;
use tracing::info;

/// Evict all expired entries from `db`.
/// Returns the number of entries removed.
pub fn evict_expired(db: &sled::Db, now_ms: u64) -> usize {
    let mut removed = 0usize;
    for item in db.iter() {
        let Ok((key, val_bytes)) = item else { continue };
        let Ok(val) = serde_json::from_slice::<StateEntry>(&val_bytes) else { continue };
        // StateEntry does not carry a TTL — the TTL comes from the ModuleDescriptor.
        // For MVP: entries older than 24h are evicted unconditionally.
        const DEFAULT_TTL_MS: u64 = 24 * 60 * 60 * 1_000;
        if now_ms.saturating_sub(val.last_modified) > DEFAULT_TTL_MS {
            let _ = db.remove(&key);
            removed += 1;
        }
    }
    if removed > 0 {
        info!(removed, "evicted expired state entries");
    }
    removed
}
