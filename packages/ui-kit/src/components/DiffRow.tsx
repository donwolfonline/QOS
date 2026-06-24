import React from 'react';
import { clsx } from 'clsx';

type DiffStatus = 'added' | 'changed' | 'removed' | 'unchanged';

interface DiffRowProps {
  status: DiffStatus;
  namespace: string;
  stateKey: string;
  vcSummary: string;
  lastModified: number;
  valuePreview: string;
  onClick?: () => void;
}

const statusStyles: Record<DiffStatus, { label: string; cls: string }> = {
  added:     { label: 'ADD', cls: 'text-qos-primary border-qos-primary' },
  changed:   { label: 'CHG', cls: 'text-qos-accent border-qos-accent' },
  removed:   { label: 'DEL', cls: 'text-qos-danger border-qos-danger opacity-60' },
  unchanged: { label: '   ', cls: 'text-qos-muted border-transparent' },
};

export function DiffRow({ status, namespace, stateKey, vcSummary, lastModified, valuePreview, onClick }: DiffRowProps) {
  const { label, cls } = statusStyles[status];
  return (
    <button
      onClick={onClick}
      disabled={status === 'removed' || !onClick}
      className={clsx(
        'w-full text-left font-mono text-xs grid grid-cols-[3rem_1fr_auto] gap-x-3 gap-y-0.5 p-2 border-b border-qos-border',
        'hover:bg-white/5 transition-colors disabled:cursor-default',
        status === 'removed' && 'opacity-50',
      )}
    >
      <span className={clsx('border px-1 rounded-sm text-center text-[10px] leading-5 shrink-0', cls)}>
        {label}
      </span>
      <span className="truncate">
        <span className="text-qos-muted">{namespace}/</span>
        <span className="text-qos-text">{stateKey}</span>
      </span>
      <span className="text-qos-muted text-[10px] tabular-nums shrink-0">{lastModified}</span>
      <span />
      <span className="text-qos-accent opacity-70 truncate col-span-2">VC: {vcSummary || '∅'}</span>
      <span />
      <span className="text-qos-muted truncate col-span-2 opacity-60">{valuePreview}</span>
    </button>
  );
}
