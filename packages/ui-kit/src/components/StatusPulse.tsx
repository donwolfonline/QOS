'use client';
import React from 'react';
import { clsx } from 'clsx';

interface StatusPulseProps {
  connected: boolean;
  label?: string;
}

export function StatusPulse({ connected, label }: StatusPulseProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-3 w-3">
        {connected && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-qos-primary opacity-75" />
        )}
        <span
          className={clsx(
            'relative inline-flex rounded-full h-3 w-3',
            connected ? 'bg-qos-primary' : 'bg-qos-danger',
          )}
        />
      </span>
      {label && (
        <span className={clsx('font-mono text-xs', connected ? 'text-qos-primary' : 'text-qos-danger')}>
          {label}
        </span>
      )}
    </div>
  );
}
