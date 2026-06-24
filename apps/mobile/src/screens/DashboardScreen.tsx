import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { useTelemetryStream } from '../hooks/useTelemetryStream';
import { NeonContainer, MetricsWidget } from 'qos-ui-shared';
import { useTelemetryStore } from '../store/useTelemetryStore';
import { MeshTopologyWidget } from '../components/MeshTopologyWidget';
import { SystemTerminal } from '../components/SystemTerminal';
import { CrtFlicker } from '../components/CrtFlicker';
import { useConnectionStore } from '../store/useConnectionStore';

export const DashboardScreen = () => {
  const { hostIp } = useConnectionStore();
  const cpuFuel = useTelemetryStore((state) => state.cpuFuel);
  const peakMemoryBytes = useTelemetryStore((state) => state.peakMemoryBytes);

  // Mount the WebSocket stream when dashboard is active
  useTelemetryStream();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <CrtFlicker color={theme.colors.accent} style={{ marginRight: theme.spacing.sm }} />
        <View>
          <Text style={styles.title}>TACTICAL_OVERVIEW</Text>
          <Text style={styles.nodeIdentity}>
            NODE: {hostIp} | MESH_ID: QOS-{hostIp?.replace(/\./g, '') || 'OFFLINE'}
          </Text>
        </View>
      </View>
      
      <View style={styles.bentoTopRow}>
        <NeonContainer color={theme.colors.primary} glowIntensity={2} style={styles.bentoBoxHalf}>
          <MeshTopologyWidget />
        </NeonContainer>
        <NeonContainer color={theme.colors.accent} glowIntensity={2} style={styles.bentoBoxHalf}>
          <MetricsWidget cpuFuel={cpuFuel} peakMemoryBytes={peakMemoryBytes} />
        </NeonContainer>
      </View>
      
      <NeonContainer color={theme.colors.primary} glowIntensity={4} style={styles.bentoBoxFull}>
        <SystemTerminal />
      </NeonContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  title: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.xl,
    ...theme.effects.neonGlow,
  },
  nodeIdentity: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.xs,
    marginTop: 2,
  },
  bentoTopRow: {
    flexDirection: 'row',
    height: 180,
    marginBottom: theme.spacing.md,
  },
  bentoBoxHalf: {
    flex: 1,
    marginHorizontal: theme.spacing.xs / 2,
  },
  bentoBoxFull: {
    flex: 1,
    marginHorizontal: theme.spacing.xs / 2,
  }
});
