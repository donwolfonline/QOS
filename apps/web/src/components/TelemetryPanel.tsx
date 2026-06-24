'use client';
import React, { useEffect, useRef } from 'react';
import { useConnection } from '@/lib/ConnectionContext';
import { clsx } from 'clsx';

const LEVEL_STYLE: Record<string, string> = {
  INFO:  'text-qos-primary',
  WARN:  'text-yellow-400',
  ERROR: 'text-qos-danger',
  DEBUG: 'text-qos-muted',
};

export function TelemetryPanel() {
  const { logs, status } = useConnection();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <section aria-label="Telemetry Feed" className="flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-mono text-[10px] text-qos-muted uppercase tracking-widest">// TELEMETRY FEED</span>
        <div className="flex-1 h-px bg-qos-border" />
        <span
          className={clsx(
            'font-mono text-[10px] tabular-nums',
            status === 'connected' ? 'text-qos-primary' : 'text-qos-muted',
          )}
        >
          {logs.length} events
        </span>
      </div>

      <div className="flex-1 bg-black/60 border border-qos-border rounded-sm overflow-hidden font-mono text-xs">
        {/* Sticky header bar */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-qos-surface border-b border-qos-border sticky top-0">
          <span className="w-2 h-2 rounded-full bg-qos-primary opacity-70 animate-pulse" />
          <span className="text-qos-muted text-[10px] tracking-widest">LIVE STREAM</span>
          <span className="ml-auto text-[10px] text-qos-muted">127.0.0.1:3000</span>
        </div>

        {/* Log lines */}
        <div className="overflow-y-auto max-h-[26rem] p-3 space-y-0.5">
          {logs.length === 0 && (
            <div className="text-qos-muted text-center py-8 opacity-50">
              Waiting for telemetry stream…
              <span className="animate-[blink_1s_step-end_infinite] inline-block ml-1">█</span>
            </div>
          )}
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2 group hover:bg-white/5 px-1 rounded transition-colors">
              <span className="shrink-0 text-qos-muted opacity-50 tabular-nums w-16">
                {new Date(log.ts).toISOString().slice(11, 19)}
              </span>
              <span className={clsx('shrink-0 w-11', LEVEL_STYLE[log.level] ?? 'text-qos-text')}>
                {log.level}
              </span>
              <span className="shrink-0 text-qos-accent opacity-60 w-28 truncate">{log.target}</span>
              <span className="text-qos-text opacity-80 break-all">{log.message}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </section>
  );
}
