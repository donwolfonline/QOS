'use client';
import React from 'react';
import { useConnection } from '@/lib/ConnectionContext';
import { clsx } from 'clsx';
import { Wifi, WifiOff, Loader2, AlertTriangle } from 'lucide-react';

const statusConfig = {
  connected:    { color: 'text-qos-primary', icon: Wifi,          label: 'MESH LINK ACTIVE',    pulse: true  },
  connecting:   { color: 'text-qos-accent',  icon: Loader2,       label: 'ESTABLISHING LINK…',  pulse: false },
  disconnected: { color: 'text-qos-muted',   icon: WifiOff,       label: 'LINK LOST',           pulse: false },
  error:        { color: 'text-qos-danger',  icon: AlertTriangle, label: 'MESH LINK ERROR',     pulse: false },
};

export function DashboardHeader() {
  const { status, nodeId, meshId, reconnect } = useConnection();
  const cfg = statusConfig[status];
  const Icon = cfg.icon;

  return (
    <header className="sticky top-0 z-40 border-b border-qos-border bg-qos-bg/90 backdrop-blur-md">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">

        {/* Logo */}
        <span
          className="font-display font-black text-lg tracking-[0.2em] text-qos-primary text-glow-primary shrink-0"
        >
          Q<span className="text-qos-accent">-</span>OS
        </span>
        <span className="text-qos-border font-mono text-xs shrink-0">COMMAND INTERFACE</span>

        <div className="flex-1" />

        {/* Node identity */}
        {nodeId && (
          <div className="hidden md:flex flex-col items-end">
            <span className="font-mono text-[10px] text-qos-muted uppercase tracking-widest">Node</span>
            <span className="font-mono text-xs text-qos-accent">{nodeId.slice(0, 20)}…</span>
          </div>
        )}
        {meshId && (
          <div className="hidden lg:flex flex-col items-end">
            <span className="font-mono text-[10px] text-qos-muted uppercase tracking-widest">Mesh</span>
            <span className="font-mono text-xs text-qos-text">{meshId.slice(0, 16)}…</span>
          </div>
        )}

        {/* Status */}
        <button
          onClick={status === 'disconnected' || status === 'error' ? reconnect : undefined}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-sm border transition-all duration-200',
            cfg.color,
            status === 'connected'
              ? 'border-qos-primary/30 bg-qos-primary/5'
              : status === 'error' || status === 'disconnected'
              ? 'border-qos-danger/30 bg-qos-danger/5 hover:bg-qos-danger/10 cursor-pointer'
              : 'border-qos-accent/30 bg-qos-accent/5',
          )}
        >
          {/* Pulse dot */}
          <span className="relative flex h-2 w-2">
            {cfg.pulse && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-qos-primary opacity-75" />
            )}
            <span className={clsx('relative inline-flex rounded-full h-2 w-2 bg-current')} />
          </span>
          <Icon
            size={13}
            className={clsx(status === 'connecting' && 'animate-spin')}
          />
          <span className="font-mono text-[11px] tracking-widest hidden sm:inline">{cfg.label}</span>
        </button>
      </div>
    </header>
  );
}
