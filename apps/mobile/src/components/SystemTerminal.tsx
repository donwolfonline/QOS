import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { theme } from '../theme';
import { useTelemetryStore, LogEntry } from '../store/useTelemetryStore';

const LogRow = ({ log }: { log: LogEntry }) => {
  const isError = log.level === 'ERROR';
  const isWarn = log.level === 'WARN';

  let color = theme.colors.primary;
  let effect = theme.effects.neonGlow;
  
  if (isError) {
    color = theme.colors.error;
    effect = theme.effects.neonGlowError;
  } else if (isWarn) {
    color = theme.colors.warning;
    effect = {} as Record<string, unknown>;
  }

  const timestamp = new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const message = log.fields?.message || JSON.stringify(log.fields);

  return (
    <View style={styles.logRow}>
      <Text style={styles.logTime}>[{timestamp}]</Text>
      <Text style={[styles.logLevel, { color, ...effect }]}>{log.level.padEnd(5)}</Text>
      <Text style={styles.logTarget}>{log.target.split('::').pop()}:</Text>
      <Text style={[styles.logMessage, isError && { color }]} numberOfLines={3}>
        {message}
      </Text>
    </View>
  );
};

export const SystemTerminal = () => {
  const logs = useTelemetryStore((state) => state.logs);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>TERMINAL_OUTPUT</Text>
      </View>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <LogRow log={item} />}
        contentContainerStyle={styles.listContent}
        inverted // Renders from bottom up (logs array has newest at index 0)
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 4,
  },
  header: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.sm,
  },
  listContent: {
    padding: theme.spacing.sm,
  },
  logRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  logTime: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.xs,
    marginRight: 6,
  },
  logLevel: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.xs,
    marginRight: 6,
    fontWeight: 'bold',
  },
  logTarget: {
    color: theme.colors.accent,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.xs,
    marginRight: 6,
  },
  logMessage: {
    flex: 1,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.xs,
  }
});
