//! Integration tests: State sync engine.

#[cfg(test)]
mod tests {
    use qos_state::{SledStateStore, StateStore};
    use qos_types::{StateKey, StateEntry};

    fn make_entry(bytes: Vec<u8>, node_id: &str, clock_val: u64, ts: u64) -> StateEntry {
        let mut vector_clock = std::collections::HashMap::new();
        vector_clock.insert(node_id.to_string(), clock_val);
        StateEntry { bytes, vector_clock, last_modified: ts }
    }

    #[test]
    fn state_roundtrip_get_set() {
        let tmp = tempfile::tempdir().unwrap();
        let store = SledStateStore::open(tmp.path()).unwrap();

        let key = StateKey::new("deadbeef", "inv-001", "counter");
        let value = make_entry(b"42".to_vec(), "NodeA", 1, 1000);

        store.set(&key, value.clone()).unwrap();

        let retrieved = store.get(&key).unwrap().expect("value should exist");
        assert_eq!(retrieved.bytes, b"42");
        assert_eq!(retrieved.vector_clock.get("NodeA"), Some(&1));
    }

    #[test]
    fn state_delete_removes_entry() {
        let tmp = tempfile::tempdir().unwrap();
        let store = SledStateStore::open(tmp.path()).unwrap();

        let key = StateKey::new("cafebabe", "inv-002", "temp");
        let value = make_entry(b"data".to_vec(), "NodeA", 1, 1000);
        store.set(&key, value).unwrap();
        store.delete(&key).unwrap();

        assert!(store.get(&key).unwrap().is_none());
    }

    #[test]
    fn flush_returns_report() {
        let tmp = tempfile::tempdir().unwrap();
        let store = SledStateStore::open(tmp.path()).unwrap();

        let key = StateKey::new("a1b2c3", "inv-003", "x");
        store.set(&key, make_entry(vec![1, 2, 3], "NodeA", 1, 1000)).unwrap();

        let report = store.flush().unwrap();
        assert_eq!(report.puts, 1);
        assert_eq!(report.failures, 0);
    }
}
