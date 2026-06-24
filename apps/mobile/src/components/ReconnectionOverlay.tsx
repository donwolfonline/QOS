import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { theme } from '../theme';
import { useConnectionStore } from '../store/useConnectionStore';

export const ReconnectionOverlay = () => {
  const { isConnected, hostIp } = useConnectionStore();
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!isConnected && hostIp) {
      // Glitch effect on X axis
      translateX.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 50 }),
          withTiming(-5, { duration: 50 }),
          withTiming(3, { duration: 50 }),
          withTiming(-3, { duration: 50 }),
          withTiming(0, { duration: 100 }),
          withTiming(0, { duration: 2000 }) // pause before next glitch
        ),
        -1,
        true
      );
      
      // Flickering opacity
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 100 }),
          withTiming(1, { duration: 100 }),
          withTiming(0.8, { duration: 50 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [isConnected, hostIp]);

  const glitchStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  if (isConnected || !hostIp) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glitchBox, glitchStyle]}>
        <Text style={styles.warningText}>[ CONNECTION LOST ]</Text>
        <Text style={styles.subText}>Re-establishing Mesh Link...</Text>
        <Text style={styles.subText}>Target: {hostIp}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 900, // Below transaction receipt but above screens
  },
  glitchBox: {
    borderWidth: 1,
    borderColor: theme.colors.error,
    padding: theme.spacing.xl,
    backgroundColor: 'rgba(255, 0, 60, 0.1)',
  },
  warningText: {
    color: theme.colors.error,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.xl,
    marginBottom: theme.spacing.md,
    ...theme.effects.neonGlowError,
    textAlign: 'center',
  },
  subText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.md,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  }
});
