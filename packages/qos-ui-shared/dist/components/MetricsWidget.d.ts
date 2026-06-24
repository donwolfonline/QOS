import React from 'react';
export interface MetricsWidgetProps {
    cpuFuel: number;
    maxCpuFuel?: number;
    peakMemoryBytes: number;
    maxMemoryBytes?: number;
}
export declare const MetricsWidget: ({ cpuFuel, maxCpuFuel, peakMemoryBytes, maxMemoryBytes, }: MetricsWidgetProps) => React.JSX.Element;
