import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { theme } from '../theme';
import { useConnectionStore } from '../store/useConnectionStore';

export const ConnectionPulse = () => {
  const { isConnected, hostIp } = useConnectionStore();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isConnected) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      scale.value = 1;
    }
  }, [isConnected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Only show if we actually have a host IP setup
  if (!hostIp) return null;

  const color = isConnected ? theme.colors.primary : theme.colors.error;

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.pulseWrapper}>
        {isConnected && (
          <Animated.View style={[styles.pulseRing, { borderColor: color }, animatedStyle]} />
        )}
        <View style={[styles.dot, { backgroundColor: color, shadowColor: color }]} />
      </View>
      <Text style={[styles.statusText, { color }]}>
        {isConnected ? 'LINK_ACTIVE' : 'LINK_OFFLINE'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // Above bottom tab bar
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 10, 0.8)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 1000,
  },
  pulseWrapper: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  pulseRing: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    opacity: 0.5,
  },
  statusText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.xs,
    fontWeight: 'bold',
  }
});
