//! The background engine that powers state synchronization.

use crate::network::{QosSyncBehaviour, QosSyncBehaviourEvent};
use crate::types::StateDelta;
use futures::StreamExt;
use libp2p::gossipsub::IdentTopic;
use libp2p::{gossipsub, kad, mdns, request_response, swarm::SwarmEvent, PeerId, Swarm};
use qos_state::{SledStateStore, StateStore};
use std::sync::{Arc, RwLock};
use tokio::sync::mpsc;
use tracing::{debug, error, info, warn};
use libp2p::ping;
use qos_types::network::{NetworkState, PeerInfo, ConnectionType};

const STATE_SYNC_TOPIC: &str = "qos-state-crtd-sync";

/// Coordinates local `SledStateStore` mutations with network peers using Gossipsub.
pub struct StateSyncEngine {
    store: Arc<SledStateStore>,
    topic: IdentTopic,
    /// Channel to send outgoing broadcast requests to the background swarm thread.
    broadcast_tx: mpsc::Sender<StateDelta>,
    network_state: Arc<RwLock<NetworkState>>,
}

impl StateSyncEngine {
    /// Spawns the background synchronization engine and returns a handle to interact with it.
    pub async fn spawn(
        mut swarm: Swarm<QosSyncBehaviour>,
        store: Arc<SledStateStore>,
        telemetry_tx: tokio::sync::broadcast::Sender<String>,
    ) -> Result<(Self, Arc<RwLock<NetworkState>>), Box<dyn std::error::Error>> {
        // Create and subscribe to the state sync topic
        let topic = IdentTopic::new(STATE_SYNC_TOPIC);
        swarm.behaviour_mut().gossipsub.subscribe(&topic)?;

        let (broadcast_tx, mut broadcast_rx) = mpsc::channel::<StateDelta>(1024);

        let engine_store = store.clone();
        let engine_topic = topic.clone();
        
        let mut local_events_rx = store.subscribe();
        let local_peer_id_str = swarm.local_peer_id().to_string();

        let network_state = Arc::new(RwLock::new(NetworkState {
            local_peer_id: local_peer_id_str.clone(),
            ..Default::default()
        }));
        let task_network_state = network_state.clone();

        // Initiate Kademlia Bootstrap (dial the bootstrap nodes to join the global DHT)
        if let Err(e) = swarm.behaviour_mut().kademlia.bootstrap() {
            warn!("Failed to start Kademlia bootstrap: {:?}", e);
        } else {
            info!("Initiated Kademlia DHT bootstrap to join global network.");
        }

        // Setup NAT Traversal fallback via Relay
        if let Ok(relay_addr) = "/dnsaddr/relay.q-os.io/p2p/12D3KooWRelayDummy".parse::<libp2p::Multiaddr>() {
            if let Err(e) = swarm.dial(relay_addr) {
                warn!("Failed to dial default relay node: {}", e);
            }
        }
        
        // Listen on circuit relay to allow NAT traversal fallback
        if let Err(e) = swarm.listen_on("/p2p-circuit".parse::<libp2p::Multiaddr>().unwrap()) {
            warn!("Failed to listen on /p2p-circuit: {}", e);
        }

        // Spawn background task to poll the Swarm
        let telemetry_tx_clone = telemetry_tx.clone();
        tokio::spawn(async move {
            loop {
                tokio::select! {
                    // 1. Handle incoming swarm events (Gossipsub messages, mDNS discoveries)
                    event = swarm.select_next_some() => {
                        handle_swarm_event(event, &mut swarm, &engine_store, &task_network_state, &telemetry_tx_clone);
                    }

                    // 2. Handle outgoing broadcasts triggered locally via API
                    Some(delta) = broadcast_rx.recv() => {
                        broadcast_delta(&mut swarm, &engine_topic, delta, &telemetry_tx_clone);
                    }

                    // 3. Handle local Sled state changes (event-subscriber bridge)
                    Ok(sync_event) = local_events_rx.recv() => {
                        let delta = match sync_event {
                            qos_types::SyncEvent::Put { key, value } => StateDelta {
                                key,
                                value: Some(value),
                                origin_peer_id: local_peer_id_str.clone(),
                            },
                            qos_types::SyncEvent::Delete { key } => StateDelta {
                                key,
                                value: None,
                                origin_peer_id: local_peer_id_str.clone(),
                            },
                        };
                        broadcast_delta(&mut swarm, &engine_topic, delta, &telemetry_tx_clone);
                    }
                }
            }
        });

        Ok((Self {
            store,
            topic,
            broadcast_tx,
            network_state: network_state.clone(),
        }, network_state))
    }

    /// Broadcasts a local mutation to the local network mesh.
    pub async fn broadcast(&self, delta: StateDelta) -> Result<(), mpsc::error::SendError<StateDelta>> {
        self.broadcast_tx.send(delta).await
    }
}

fn broadcast_delta(swarm: &mut Swarm<QosSyncBehaviour>, topic: &IdentTopic, delta: StateDelta, telemetry_tx: &tokio::sync::broadcast::Sender<String>) {
    // Attempt serialization and broadcasting
    let encoded = match bincode::serialize(&delta) {
        Ok(bytes) => bytes,
        Err(e) => {
            error!("Failed to serialize StateDelta for broadcast: {}", e);
            return;
        }
    };

    if let Err(e) = swarm.behaviour_mut().gossipsub.publish(topic.clone(), encoded) {
        error!("Failed to publish state delta via Gossipsub: {:?}", e);
    } else {
        info!("Published state CRDT delta via Gossipsub for key {}", delta.key.key);
        
        // Emit pulse
        let pulse = serde_json::json!({
            "type": "GOSSIPSUB_PULSE",
            "source": "local",
            "key": delta.key.key,
        });
        let _ = telemetry_tx.send(pulse.to_string());
    }
}

fn handle_swarm_event(
    event: SwarmEvent<QosSyncBehaviourEvent>,
    swarm: &mut Swarm<QosSyncBehaviour>,
    store: &Arc<SledStateStore>,
    network_state: &Arc<RwLock<NetworkState>>,
    telemetry_tx: &tokio::sync::broadcast::Sender<String>,
) {
    match event {
        SwarmEvent::Behaviour(QosSyncBehaviourEvent::Mdns(mdns::Event::Discovered(list))) => {
            for (peer_id, multiaddr) in list {
                info!("mDNS discovered peer: {} at {}", peer_id, multiaddr);
                // Gossipsub automatically adds discovered peers to the mesh if they subscribe to the same topic.
                swarm.behaviour_mut().gossipsub.add_explicit_peer(&peer_id);
                
                // Immediately request a full state sync to catch up on pre-existing data.
                info!("Sending immediate SyncRequest to newly discovered node: {}", peer_id);
                swarm.behaviour_mut().request_response.send_request(&peer_id, crate::network::SyncRequest);
            }
        }
        SwarmEvent::Behaviour(QosSyncBehaviourEvent::Mdns(mdns::Event::Expired(list))) => {
            for (peer_id, multiaddr) in list {
                info!("mDNS expired peer: {} at {}", peer_id, multiaddr);
                swarm.behaviour_mut().gossipsub.remove_explicit_peer(&peer_id);
            }
        }
        SwarmEvent::Behaviour(QosSyncBehaviourEvent::RequestResponse(request_response::Event::Message {
            peer: peer_id,
            message,
            ..
        })) => {
            match message {
                request_response::Message::Request { request: _, channel, .. } => {
                    info!("Received SyncRequest from node {}", peer_id);
                    // Gather all local state
                    let mut deltas = Vec::new();
                    if let Ok(all_state) = store.get_all() {
                        let local_peer_id = swarm.local_peer_id().to_string();
                        for (key, value) in all_state {
                            deltas.push(StateDelta {
                                key,
                                value: Some(value),
                                origin_peer_id: local_peer_id.clone(),
                            });
                        }
                    }
                    // Send response
                    let response = crate::network::SyncResponse { deltas };
                    if let Err(_) = swarm.behaviour_mut().request_response.send_response(channel, response) {
                        error!("Failed to send SyncResponse back to {}", peer_id);
                    }
                }
                request_response::Message::Response { response, .. } => {
                    info!("Received SyncResponse from node {} with {} deltas", peer_id, response.deltas.len());
                    for delta in response.deltas {
                        process_incoming_delta(peer_id, delta, store);
                    }
                }
            }
        }
        SwarmEvent::Behaviour(QosSyncBehaviourEvent::RequestResponse(request_response::Event::OutboundFailure {
            peer, error, ..
        })) => {
            warn!("Failed to send SyncRequest to peer {}: {:?}", peer, error);
        }
        SwarmEvent::Behaviour(QosSyncBehaviourEvent::Gossipsub(gossipsub::Event::Message {
            propagation_source: peer_id,
            message_id: _id,
            message,
        })) => {
            // We received a state sync event from the network!
            
            if let Ok(delta) = bincode::deserialize::<StateDelta>(&message.data) {
                let pulse = serde_json::json!({
                    "type": "GOSSIPSUB_PULSE",
                    "source": peer_id.to_string(),
                    "key": delta.key.key,
                });
                let _ = telemetry_tx.send(pulse.to_string());
            }

            process_incoming_gossip_message(peer_id, message, store);
        }
        SwarmEvent::Behaviour(QosSyncBehaviourEvent::Kademlia(kad::Event::OutboundQueryProgressed {
            result: kad::QueryResult::Bootstrap(Ok(_)),
            ..
        })) => {
            info!("Kademlia DHT bootstrap successful!");
        }
        SwarmEvent::Behaviour(QosSyncBehaviourEvent::Kademlia(kad::Event::RoutingUpdated {
            peer,
            is_new_peer,
            addresses,
            ..
        })) => {
            if is_new_peer {
                info!("DHT discovered new global peer: {} at {:?}", peer, addresses);
                // The prompt asked for: "When a node discovers a new peer via the DHT, it should automatically add them to its local routing table."
                // In libp2p, Kademlia does this automatically for its own table, but we must also inject them into Gossipsub so the mesh can form.
                swarm.behaviour_mut().gossipsub.add_explicit_peer(&peer);
                
                // We can also initiate a sync request just like we do for mDNS
                info!("Sending immediate SyncRequest to DHT-discovered node: {}", peer);
                swarm.behaviour_mut().request_response.send_request(&peer, crate::network::SyncRequest);
            }
        }
        SwarmEvent::NewListenAddr { address, .. } => {
            info!("StateSyncEngine listening on {}", address);
            if let Ok(mut state) = network_state.write() {
                state.listen_addrs.push(address.to_string());
            }
        }
        SwarmEvent::ConnectionEstablished { peer_id, endpoint, .. } => {
            let addr = endpoint.get_remote_address().to_string();
            let is_relay = addr.contains("/p2p-circuit");
            if is_relay {
                info!("[MESH] Secure tunnel established via Relay");
            } else {
                info!("[MESH] Direct P2P connection active");
            }
            if let Ok(mut state) = network_state.write() {
                state.peers.insert(peer_id.to_string(), PeerInfo {
                    multiaddr: Some(addr),
                    latency_ms: None,
                    connection_type: if is_relay { ConnectionType::Relayed } else { ConnectionType::Direct },
                });
            }
        }
        SwarmEvent::ConnectionClosed { peer_id, .. } => {
            if let Ok(mut state) = network_state.write() {
                state.peers.remove(&peer_id.to_string());
            }
        }
        SwarmEvent::Behaviour(QosSyncBehaviourEvent::Ping(ping::Event { peer, result: Ok(rtt), .. })) => {
            if let Ok(mut state) = network_state.write() {
                if let Some(peer_info) = state.peers.get_mut(&peer.to_string()) {
                    peer_info.latency_ms = Some(rtt.as_millis() as u64);
                }
            }
        }
        _ => {}
    }
}

fn process_incoming_gossip_message(
    peer_id: PeerId,
    message: gossipsub::Message,
    store: &Arc<SledStateStore>,
) {
    let incoming_delta: StateDelta = match bincode::deserialize(&message.data) {
        Ok(d) => d,
        Err(e) => {
            warn!("Received malformed gossipsub message from {}: {}", peer_id, e);
            return;
        }
    };
    process_incoming_delta(peer_id, incoming_delta, store);
}

fn process_incoming_delta(
    peer_id: PeerId,
    incoming_delta: StateDelta,
    store: &Arc<SledStateStore>,
) {
    debug!("Received incoming delta from {}: {:?}", peer_id, incoming_delta);

    // CRDT Conflict Resolution (Vector Clock)
    // 1. Fetch current local state for this key
    let local_value = store.get(&incoming_delta.key).unwrap_or(None);

    let (merged_value, should_apply) = match (local_value, incoming_delta.value) {
        (Some(local_entry), Some(remote_entry)) => {
            // Check for concurrent writes and emit telemetry event
            if local_entry.is_concurrent(&remote_entry) {
                warn!(
                    peer = %peer_id,
                    key = %incoming_delta.key.key,
                    local_modified = local_entry.last_modified,
                    remote_modified = remote_entry.last_modified,
                    "Concurrent vector clock conflict detected! Applying LWW tie-breaker."
                );
            }
            // Both have values: apply Vector Clock merge
            let merged = local_entry.merge(&remote_entry);
            let apply = merged != local_entry;
            (Some(merged), apply)
        }
        (None, Some(remote_entry)) => {
            // Local doesn't have it, incoming wins
            (Some(remote_entry), true)
        }
        (Some(_local), None) => {
            // Remote deleted it. In a robust CRDT we would merge tombstones, 
            // but here we just blindly accept the deletion.
            (None, true)
        }
        (None, None) => {
            // Both are deletions
            (None, false)
        }
    };

    if should_apply {
        info!("Applying remote CRDT delta for key {}", incoming_delta.key.key);
        if let Err(e) = store.apply_remote(&incoming_delta.key, merged_value) {
            error!("Failed to apply remote StateDelta to Sled: {}", e);
        }
    } else {
        debug!("Ignored incoming StateDelta; local state dominates or is identical.");
    }
}
