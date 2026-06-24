import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../theme';
import { useTelemetryStore, PeerNode } from '../store/useTelemetryStore';

const PeerItem = ({ peer }: { peer: PeerNode }) => {
  const color = peer.isActive ? theme.colors.primary : theme.colors.textMuted;
  const glow = peer.isActive ? theme.effects.neonGlow : {};
  
  return (
    <View style={styles.peerRow}>
      <View style={[styles.statusDot, { backgroundColor: color, shadowColor: color }]} />
      <Text style={[styles.peerId, { color, ...glow }]} numberOfLines={1}>
        {peer.id}
      </Text>
    </View>
  );
};

export const MeshTopologyWidget = () => {
  const peers = useTelemetryStore((state) => state.peers);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>MESH_TOPOLOGY</Text>
      <ScrollView style={styles.list}>
        {peers.length === 0 ? (
          <Text style={styles.empty}>No peers discovered in local mesh.</Text>
        ) : (
          peers.map(p => <PeerItem key={p.id} peer={p} />)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.xs,
    marginBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 4,
  },
  list: {
    flex: 1,
  },
  empty: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.xs,
    fontStyle: 'italic',
  },
  peerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  peerId: {
    flex: 1,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.sm,
  }
});
