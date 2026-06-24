import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface CrtFlickerProps {
  color?: string;
  style?: ViewStyle;
}

export const CrtFlicker = ({ color = theme.colors.primary, style }: CrtFlickerProps) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 50, easing: Easing.linear }),
        withTiming(1, { duration: 150, easing: Easing.linear }),
        withTiming(0.8, { duration: 100, easing: Easing.linear }),
        withTiming(1, { duration: 50, easing: Easing.linear }),
        withTiming(1, { duration: 800, easing: Easing.linear }) // Pause between flickers
      ),
      -1, // Infinite
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.indicator, { backgroundColor: color, shadowColor: color }, style, animatedStyle]} />
  );
};

const styles = StyleSheet.create({
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  }
});
