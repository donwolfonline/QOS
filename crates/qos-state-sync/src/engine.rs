//! The background engine that powers state synchronization.

use crate::network::{QosSyncBehaviour, QosSyncBehaviourEvent};
use crate::types::StateDelta;
use futures::StreamExt;
use libp2p::gossipsub::IdentTopic;
use libp2p::{gossipsub, mdns, request_response, swarm::SwarmEvent, PeerId, Swarm};
use qos_state::{SledStateStore, StateStore};
use std::sync::Arc;
use tokio::sync::mpsc;
use tracing::{debug, error, info, warn};

const STATE_SYNC_TOPIC: &str = "qos-state-v1";

/// Coordinates local `SledStateStore` mutations with network peers using Gossipsub.
pub struct StateSyncEngine {
    store: Arc<SledStateStore>,
    topic: IdentTopic,
    /// Channel to send outgoing broadcast requests to the background swarm thread.
    broadcast_tx: mpsc::Sender<StateDelta>,
}

impl StateSyncEngine {
    /// Spawns the background synchronization engine and returns a handle to interact with it.
    pub async fn spawn(
        mut swarm: Swarm<QosSyncBehaviour>,
        store: Arc<SledStateStore>,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        // Start listening on all interfaces (OS assigned port)
        swarm.listen_on("/ip4/0.0.0.0/tcp/0".parse()?)?;

        // Create and subscribe to the state sync topic
        let topic = IdentTopic::new(STATE_SYNC_TOPIC);
        swarm.behaviour_mut().gossipsub.subscribe(&topic)?;

        let (broadcast_tx, mut broadcast_rx) = mpsc::channel::<StateDelta>(1024);

        let engine_store = store.clone();
        let engine_topic = topic.clone();
        
        let mut local_events_rx = store.subscribe();
        let local_peer_id_str = swarm.local_peer_id().to_string();

        // Spawn background task to poll the Swarm
        tokio::spawn(async move {
            loop {
                tokio::select! {
                    // 1. Handle incoming swarm events (Gossipsub messages, mDNS discoveries)
                    event = swarm.select_next_some() => {
                        handle_swarm_event(event, &mut swarm, &engine_store);
                    }

                    // 2. Handle outgoing broadcasts triggered locally via API
                    Some(delta) = broadcast_rx.recv() => {
                        broadcast_delta(&mut swarm, &engine_topic, delta);
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
                        broadcast_delta(&mut swarm, &engine_topic, delta);
                    }
                }
            }
        });

        Ok(Self {
            store,
            topic,
            broadcast_tx,
        })
    }

    /// Broadcasts a local mutation to the local network mesh.
    pub async fn broadcast(&self, delta: StateDelta) -> Result<(), mpsc::error::SendError<StateDelta>> {
        self.broadcast_tx.send(delta).await
    }
}

fn broadcast_delta(swarm: &mut Swarm<QosSyncBehaviour>, topic: &IdentTopic, delta: StateDelta) {
    let encoded = match bincode::serialize(&delta) {
        Ok(bytes) => bytes,
        Err(e) => {
            error!("Failed to serialize StateDelta for broadcast: {}", e);
            return;
        }
    };

    if let Err(e) = swarm.behaviour_mut().gossipsub.publish(topic.clone(), encoded) {
        error!("Failed to publish Gossipsub message: {:?}", e);
    } else {
        debug!("Broadcasted StateDelta for key: {:?}", delta.key.key);
    }
}

fn handle_swarm_event(
    event: SwarmEvent<QosSyncBehaviourEvent>,
    swarm: &mut Swarm<QosSyncBehaviour>,
    store: &Arc<SledStateStore>,
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
            process_incoming_gossip_message(peer_id, message, store);
        }
        SwarmEvent::NewListenAddr { address, .. } => {
            info!("StateSyncEngine listening on {}", address);
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
