'use client';
import React, { useEffect, useRef } from 'react';
import { clsx } from 'clsx';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  target: string;
  message: string;
}

interface TerminalLogProps {
  logs: LogEntry[];
  maxHeight?: string;
  className?: string;
}

const levelColor = {
  INFO:  'text-qos-primary',
  WARN:  'text-yellow-400',
  ERROR: 'text-qos-danger',
  DEBUG: 'text-qos-muted',
};

export function TerminalLog({ logs, maxHeight = '16rem', className }: TerminalLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div
      className={clsx(
        'font-mono text-xs bg-black/60 border border-qos-border rounded-sm overflow-y-auto',
        className,
      )}
      style={{ maxHeight }}
    >
      <div className="sticky top-0 flex items-center justify-between bg-qos-surface px-3 py-1 border-b border-qos-border">
        <span className="text-qos-muted tracking-widest uppercase text-[10px]">// TELEMETRY FEED</span>
        <span className="text-qos-muted text-[10px]">{logs.length} events</span>
      </div>
      <div className="p-3 space-y-1">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 items-start group">
            <span className="shrink-0 text-qos-muted opacity-60">{log.timestamp.slice(11, 19)}</span>
            <span className={clsx('shrink-0 w-12', levelColor[log.level])}>{log.level}</span>
            <span className="shrink-0 text-qos-accent opacity-70 max-w-[120px] truncate">{log.target}</span>
            <span className="text-qos-text opacity-80 break-all">{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
