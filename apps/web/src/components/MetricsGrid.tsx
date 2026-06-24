'use client';
import React from 'react';
import { useConnection } from '@/lib/ConnectionContext';
import { clsx } from 'clsx';
import { Cpu, Zap, HardDrive, Wifi, Activity } from 'lucide-react';

interface MetricConfig {
  key: string;
  label: string;
  unit: string;
  icon: React.ElementType;
  variant: 'primary' | 'accent' | 'danger';
  format?: (v: number) => string;
}

const METRICS: MetricConfig[] = [
  { key: 'cpu_usage_pct',   label: 'CPU LOAD',    unit: '%',   icon: Cpu,       variant: 'primary' },
  { key: 'memory_mb',       label: 'MEMORY',      unit: 'MB',  icon: HardDrive, variant: 'accent'  },
  { key: 'wasm_executions', label: 'WASM EXEC',   unit: '/s',  icon: Zap,       variant: 'primary' },
  { key: 'mesh_peers',      label: 'MESH PEERS',  unit: '',    icon: Wifi,      variant: 'accent'  },
  { key: 'state_keys',      label: 'STATE KEYS',  unit: '',    icon: Activity,  variant: 'primary' },
];

const glowBorder: Record<string, string> = {
  primary: 'border-qos-primary/30 shadow-[0_0_20px_rgba(0,255,65,0.1)]',
  accent:  'border-qos-accent/30  shadow-[0_0_20px_rgba(0,212,255,0.1)]',
  danger:  'border-qos-danger/30  shadow-[0_0_20px_rgba(255,0,60,0.1)]',
};

const variantText: Record<string, string> = {
  primary: 'text-qos-primary',
  accent:  'text-qos-accent',
  danger:  'text-qos-danger',
};

function MetricCard({ config, value }: { config: MetricConfig; value: number | undefined }) {
  const Icon = config.icon;
  const display = value !== undefined ? (config.format ? config.format(value) : value.toFixed(1)) : '—';

  return (
    <div
      className={clsx(
        'relative bg-qos-surface border rounded-sm p-4 flex flex-col gap-2 transition-all duration-500',
        glowBorder[config.variant],
      )}
    >
      {/* Corner accents */}
      <span className={clsx('absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 opacity-50', variantText[config.variant])} style={{borderColor:'currentColor'}} />
      <span className={clsx('absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 opacity-50', variantText[config.variant])} style={{borderColor:'currentColor'}} />

      <div className="flex items-center gap-2">
        <Icon size={14} className={clsx('opacity-60', variantText[config.variant])} />
        <span className="font-mono text-[10px] text-qos-muted uppercase tracking-widest">
          {config.label}
        </span>
      </div>
      <div className="flex items-end gap-1.5 mt-1">
        <span className={clsx('font-mono text-3xl font-bold tabular-nums leading-none', variantText[config.variant])}>
          {display}
        </span>
        {config.unit && (
          <span className="font-mono text-sm text-qos-muted mb-0.5">{config.unit}</span>
        )}
      </div>
    </div>
  );
}

export function MetricsGrid() {
  const { metrics } = useConnection();
  return (
    <section aria-label="Metrics">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-mono text-[10px] text-qos-muted uppercase tracking-widest">// NODE VITALS</span>
        <div className="flex-1 h-px bg-qos-border" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {METRICS.map((m) => (
          <MetricCard key={m.key} config={m} value={metrics[m.key]} />
        ))}
      </div>
    </section>
  );
}
