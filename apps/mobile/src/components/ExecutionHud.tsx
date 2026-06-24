import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { theme } from '../theme';

interface ExecutionHudProps {
  isVisible: boolean;
}

export const ExecutionHud = ({ isVisible }: ExecutionHudProps) => {
  const [phase, setPhase] = useState(0);
  const progress = useSharedValue(0);

  const phases = [
    'AWAITING PAYLOAD...',
    'INITIALIZING SANDBOX...',
    'COMPILING WASM...',
    'EXECUTING...'
  ];

  useEffect(() => {
    if (isVisible) {
      setPhase(1);
      progress.value = withTiming(25, { duration: 400 });
      
      // Simulate HUD progress for the aesthetic before the actual fetch resolves
      // The real execution fetch is happening concurrently in the parent component
      const t1 = setTimeout(() => { setPhase(2); progress.value = withTiming(50, { duration: 400 }); }, 800);
      const t2 = setTimeout(() => { setPhase(3); progress.value = withTiming(95, { duration: 1500, easing: Easing.out(Easing.exp) }); }, 1600);
      
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      setPhase(0);
      progress.value = 0;
    }
  }, [isVisible]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>[ SYS_EXECUTION ]</Text>
      <Text style={styles.phaseText}>{phases[phase]}</Text>
      
      <View style={styles.barBackground}>
        <Animated.View style={[styles.barFill, progressStyle]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    zIndex: 100,
  },
  title: {
    color: theme.colors.accent,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.xl,
    marginBottom: theme.spacing.lg,
    ...theme.effects.neonGlow,
  },
  phaseText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.md,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  barBackground: {
    width: '100%',
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  }
});
