use libp2p::{identity, Swarm};
use qos_state::SledStateStore;
use qos_state::StateStore;
use qos_state_sync::network::QosSyncBehaviour;
use qos_state_sync::types::StateDelta;
use qos_state_sync::StateSyncEngine;
use qos_types::sync::{StateKey, StateEntry};
use std::sync::Arc;
use std::time::Duration;

fn make_entry(bytes: Vec<u8>, node_id: &str, clock_val: u64, ts: u64) -> StateEntry {
    let mut vector_clock = std::collections::HashMap::new();
    vector_clock.insert(node_id.to_string(), clock_val);
    StateEntry { bytes, vector_clock, last_modified: ts }
}

async fn setup_node(db_path: &std::path::Path) -> (Arc<SledStateStore>, StateSyncEngine) {
    let local_key = identity::Keypair::generate_ed25519();
    let _local_peer_id = local_key.public().to_peer_id();

    let mut swarm = libp2p::SwarmBuilder::with_existing_identity(local_key)
        .with_tokio()
        .with_tcp(
            libp2p::tcp::Config::default(),
            libp2p::noise::Config::new,
            libp2p::yamux::Config::default,
        ).unwrap()
        .with_relay_client(libp2p::noise::Config::new, libp2p::yamux::Config::default).unwrap()
        .with_behaviour(|key, relay_behaviour| {
            QosSyncBehaviour::new(key, relay_behaviour).expect("Failed to init behaviour")
        }).unwrap()
        .with_swarm_config(|c| c.with_idle_connection_timeout(Duration::from_secs(60)))
        .build();

    swarm.listen_on("/ip4/0.0.0.0/tcp/0".parse().unwrap()).unwrap();

    let store = Arc::new(SledStateStore::open(db_path).unwrap());
    let (telemetry_tx, _) = tokio::sync::broadcast::channel::<String>(1024);
    let (engine, _network_state) = StateSyncEngine::spawn(swarm, store.clone(), telemetry_tx).await.unwrap();

    (store, engine)
}

#[tokio::test]
async fn test_crdt_sync_gossipsub() {
    let dir1 = tempfile::tempdir().unwrap();
    let dir2 = tempfile::tempdir().unwrap();

    let (store1, _engine1) = setup_node(dir1.path()).await;
    let (store2, _engine2) = setup_node(dir2.path()).await;

    // Allow some time for mDNS to discover peers and Gossipsub mesh to form.
    tokio::time::sleep(Duration::from_secs(2)).await;

    // Node 1 writes to local store
    let key = StateKey::new("test_module", "inv_1", "counter");
    let val = make_entry(vec![42], "Node1", 1, 1000);

    // The SyncBridge will automatically catch this and broadcast it to the network!
    store1.set(&key, val.clone()).unwrap();

    // Wait for network propagation
    let mut received = false;
    for _ in 0..10 {
        tokio::time::sleep(Duration::from_millis(100)).await;
        if let Ok(Some(v)) = store2.get(&key) {
            assert_eq!(v.bytes, vec![42]);
            assert_eq!(v.vector_clock.get("Node1"), Some(&1));
            received = true;
            break;
        }
    }

    assert!(received, "Node 2 never received the state delta via Gossipsub");
}

/// Unit test: Concurrent writes from two different nodes are merged correctly.
/// Verifies that the higher `last_modified` timestamp wins (LWW tie-breaker),
/// and the resulting merged vector clock contains entries from BOTH nodes.
#[test]
fn test_concurrent_peer_updates_merged_not_lost() {
    let _key = StateKey::new("test_module", "inv_concurrent", "shared_value");

    // Node A writes at time=100 with its own clock
    let node_a_entry = StateEntry {
        bytes: b"value_from_A".to_vec(),
        vector_clock: {
            let mut m = std::collections::HashMap::new();
            m.insert("NodeA".to_string(), 2); // NodeA has seen 2 events
            m
        },
        last_modified: 100,
    };

    // Node B concurrently writes at time=200 (later wall clock, but neither clock dominates)
    let node_b_entry = StateEntry {
        bytes: b"value_from_B".to_vec(),
        vector_clock: {
            let mut m = std::collections::HashMap::new();
            m.insert("NodeB".to_string(), 3); // NodeB has seen 3 events, but never saw NodeA
            m
        },
        last_modified: 200,
    };

    // Verify concurrency is detected
    assert!(
        node_a_entry.is_concurrent(&node_b_entry),
        "NodeA and NodeB entries should be detected as concurrent (neither dominates)"
    );

    // Merge: NodeB should win (last_modified 200 > 100)
    let merged = node_a_entry.merge(&node_b_entry);
    assert_eq!(merged.bytes, b"value_from_B", "LWW: NodeB (ts=200) should win over NodeA (ts=100)");

    // Merged vector clock must contain BOTH nodes — no state is lost
    assert_eq!(merged.vector_clock.get("NodeA"), Some(&2), "Merged clock must preserve NodeA's history");
    assert_eq!(merged.vector_clock.get("NodeB"), Some(&3), "Merged clock must preserve NodeB's history");
}

/// Unit test: Causal dominance — Node B's update causally dominates Node A's.
/// Remote should win without flagging a conflict.
#[test]
fn test_causal_dominance_remote_wins() {
    // NodeA writes first
    let local_entry = StateEntry {
        bytes: b"old_value".to_vec(),
        vector_clock: {
            let mut m = std::collections::HashMap::new();
            m.insert("NodeA".to_string(), 1);
            m
        },
        last_modified: 100,
    };

    // NodeB builds on top of NodeA's write (causally dominates)
    let remote_entry = StateEntry {
        bytes: b"new_value".to_vec(),
        vector_clock: {
            let mut m = std::collections::HashMap::new();
            m.insert("NodeA".to_string(), 1); // Saw NodeA's event
            m.insert("NodeB".to_string(), 1); // Plus its own
            m
        },
        last_modified: 200,
    };

    // Verify NOT concurrent — remote causally dominates
    assert!(
        !local_entry.is_concurrent(&remote_entry),
        "Remote causally dominates local, should not be concurrent"
    );

    let merged = local_entry.merge(&remote_entry);
    assert_eq!(merged.bytes, b"new_value", "Causally dominant remote should win cleanly");
}
