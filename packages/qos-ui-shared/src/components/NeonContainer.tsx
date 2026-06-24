import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import Svg, { Rect, Defs, Filter, FeDropShadow } from 'react-native-svg';

export interface NeonContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  color?: string;
  glowIntensity?: number;
}

export const NeonContainer = ({ 
  children, 
  style, 
  color = '#00ff41',
  glowIntensity = 4
}: NeonContainerProps) => {
  const isWeb = Platform.OS === 'web';
  
  return (
    <View style={[styles.container, style, isWeb && {
      boxShadow: `0 0 ${glowIntensity * 3}px ${color}`,
      borderColor: color,
      borderWidth: 1.5,
      borderRadius: 4,
    } as any]}>
      {!isWeb && (
        <View style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%">
            <Defs>
              <Filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <FeDropShadow dx="0" dy="0" stdDeviation={glowIntensity} floodColor={color} floodOpacity="0.8" />
              </Filter>
            </Defs>
            <Rect
              x="2"
              y="2"
              width="99%"
              height="99%"
              rx="4"
              ry="4"
              fill="transparent"
              stroke={color}
              strokeWidth="1.5"
              filter="url(#glow)"
            />
          </Svg>
        </View>
      )}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: 'rgba(18, 18, 18, 0.7)', // Glassmorphism base
  },
  content: {
    padding: 16,
  }
});
