import React from 'react';
import { View, StyleSheet } from 'react-native';

export interface ScanlineOverlayProps {
  opacity?: number;
  color?: string;
}

export const ScanlineOverlay = ({ opacity = 0.1, color = '#ffffff' }: ScanlineOverlayProps) => {
  return (
    <View style={[styles.overlay, { opacity }]} pointerEvents="none">
      {Array.from({ length: 150 }).map((_, i) => (
        <View key={i} style={[styles.scanline, { backgroundColor: color }]} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    overflow: 'hidden',
  },
  scanline: {
    height: 1,
    marginBottom: 4,
  }
});
