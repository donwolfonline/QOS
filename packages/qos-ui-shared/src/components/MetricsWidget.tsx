"use client";
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

export interface MetricsWidgetProps {
  cpuFuel: number;
  maxCpuFuel?: number;
  peakMemoryBytes: number;
  maxMemoryBytes?: number;
}

export const MetricsWidget = ({
  cpuFuel,
  maxCpuFuel = 10000,
  peakMemoryBytes,
  maxMemoryBytes = 5 * 1024 * 1024,
}: MetricsWidgetProps) => {
  const fuelProgress = useSharedValue(0);
  const memProgress = useSharedValue(0);

  useEffect(() => {
    fuelProgress.value = withTiming(Math.min((cpuFuel / maxCpuFuel) * 100, 100), {
      duration: 500,
      easing: Easing.out(Easing.exp),
    });
  }, [cpuFuel, maxCpuFuel]);

  useEffect(() => {
    memProgress.value = withTiming(Math.min((peakMemoryBytes / maxMemoryBytes) * 100, 100), {
      duration: 500,
      easing: Easing.out(Easing.exp),
    });
  }, [peakMemoryBytes, maxMemoryBytes]);

  const fuelBarStyle = useAnimatedStyle(() => ({
    width: `${fuelProgress.value}%`,
  }));

  const memBarStyle = useAnimatedStyle(() => ({
    width: `${memProgress.value}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.metricBox}>
        <Text style={styles.metricLabel}>CPU FUEL</Text>
        <Text style={styles.metricValue}>{cpuFuel}</Text>
        <View style={styles.barBackground}>
          <Animated.View style={[styles.barFill, { backgroundColor: '#00d4ff' }, fuelBarStyle]} />
        </View>
      </View>

      <View style={styles.metricBox}>
        <Text style={styles.metricLabel}>PEAK MEM</Text>
        <Text style={styles.metricValue}>{(peakMemoryBytes / 1024).toFixed(1)} KB</Text>
        <View style={styles.barBackground}>
          <Animated.View style={[styles.barFill, { backgroundColor: '#ff003c' }, memBarStyle]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricBox: {
    flex: 1,
    padding: 8,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  metricLabel: {
    color: '#555555',
    fontFamily: 'FiraCode_400Regular, "Fira Code", monospace',
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    color: '#00ff41',
    fontFamily: 'FiraCode_400Regular, "Fira Code", monospace',
    fontSize: 16,
    textShadowColor: '#00ff41',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    marginBottom: 8,
  },
  barBackground: {
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  }
});
