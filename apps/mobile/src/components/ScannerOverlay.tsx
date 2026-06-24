import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { theme } from '../theme';

export const ScannerOverlay = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.darkenTop} />
      <View style={styles.centerRow}>
        <View style={styles.darkenSide} />
        
        <Animated.View style={[styles.targetBox, animatedStyle]}>
          {/* Top Left */}
          <View style={[styles.bracket, styles.topLeft]} />
          {/* Top Right */}
          <View style={[styles.bracket, styles.topRight]} />
          {/* Bottom Left */}
          <View style={[styles.bracket, styles.bottomLeft]} />
          {/* Bottom Right */}
          <View style={[styles.bracket, styles.bottomRight]} />
          
          {/* Scanning Line */}
          <Animated.View style={[styles.scanLine]} />
        </Animated.View>

        <View style={styles.darkenSide} />
      </View>
      <View style={styles.darkenBottom} />
    </View>
  );
};

const BORDER_LENGTH = 30;
const BORDER_WIDTH = 4;

const styles = StyleSheet.create({
  darkenTop: { flex: 1, backgroundColor: 'rgba(10, 10, 10, 0.7)' },
  darkenBottom: { flex: 1, backgroundColor: 'rgba(10, 10, 10, 0.7)' },
  centerRow: { flexDirection: 'row', height: 250 },
  darkenSide: { flex: 1, backgroundColor: 'rgba(10, 10, 10, 0.7)' },
  targetBox: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  bracket: {
    position: 'absolute',
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  topLeft: {
    top: 0, left: 0,
    width: BORDER_LENGTH, height: BORDER_LENGTH,
    borderTopWidth: BORDER_WIDTH, borderLeftWidth: BORDER_WIDTH,
  },
  topRight: {
    top: 0, right: 0,
    width: BORDER_LENGTH, height: BORDER_LENGTH,
    borderTopWidth: BORDER_WIDTH, borderRightWidth: BORDER_WIDTH,
  },
  bottomLeft: {
    bottom: 0, left: 0,
    width: BORDER_LENGTH, height: BORDER_LENGTH,
    borderBottomWidth: BORDER_WIDTH, borderLeftWidth: BORDER_WIDTH,
  },
  bottomRight: {
    bottom: 0, right: 0,
    width: BORDER_LENGTH, height: BORDER_LENGTH,
    borderBottomWidth: BORDER_WIDTH, borderRightWidth: BORDER_WIDTH,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: theme.colors.accent,
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  }
});
