import React from 'react';
import { ViewStyle } from 'react-native';
export interface NeonContainerProps {
    children: React.ReactNode;
    style?: ViewStyle;
    color?: string;
    glowIntensity?: number;
}
export declare const NeonContainer: ({ children, style, color, glowIntensity }: NeonContainerProps) => React.JSX.Element;
