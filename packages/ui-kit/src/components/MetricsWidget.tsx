import React from 'react';
import { clsx } from 'clsx';
import { NeonContainer } from './NeonContainer';

export interface MetricData {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  variant?: 'primary' | 'accent' | 'danger';
}

interface MetricsWidgetProps {
  metric: MetricData;
  className?: string;
}

const trendIcons = { up: '▲', down: '▼', stable: '━' };
const trendColors = { up: 'text-qos-primary', down: 'text-qos-danger', stable: 'text-qos-muted' };

export function MetricsWidget({ metric, className }: MetricsWidgetProps) {
  return (
    <NeonContainer variant={metric.variant ?? 'primary'} className={clsx('flex flex-col gap-2', className)}>
      <span className="text-qos-muted font-mono text-xs uppercase tracking-widest">
        {metric.label}
      </span>
      <div className="flex items-end gap-2">
        <span className="font-mono text-3xl font-bold text-qos-primary tabular-nums leading-none">
          {metric.value}
        </span>
        {metric.unit && (
          <span className="font-mono text-sm text-qos-muted mb-1">{metric.unit}</span>
        )}
        {metric.trend && (
          <span className={clsx('font-mono text-sm mb-1', trendColors[metric.trend])}>
            {trendIcons[metric.trend]}
          </span>
        )}
      </div>
    </NeonContainer>
  );
}
