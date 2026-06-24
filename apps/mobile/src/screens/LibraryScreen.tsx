import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

export const LibraryScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LOCAL_BUNDLES</Text>
      <Text style={styles.subtitle}>No .qos files found on device.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.xl,
    ...theme.effects.neonGlow,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
  }
});
