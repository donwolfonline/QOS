'use client';
import React from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { MetricsGrid } from '@/components/MetricsGrid';
import { TelemetryPanel } from '@/components/TelemetryPanel';
import { EdgeExplorer } from '@/components/EdgeExplorer';
import { useConnection } from '@/lib/ConnectionContext';

function ScanlineOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 mix-blend-overlay"
      style={{
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0,255,65,0.012) 2px,
          rgba(0,255,65,0.012) 4px
        )`,
      }}
    />
  );
}

function ReconnectOverlay() {
  const { status, reconnect } = useConnection();
  if (status !== 'disconnected' && status !== 'error') return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-qos-bg/80 backdrop-blur-sm">
      <div className="text-center space-y-4">
        {/* Glitch text effect via CSS animation */}
        <p
          className="font-display font-black text-2xl text-qos-danger tracking-[0.2em]"
          style={{ textShadow: '0 0 20px rgba(255,0,60,0.6)' }}
        >
          MESH LINK SEVERED
        </p>
        <p className="font-mono text-xs text-qos-muted">RE-ESTABLISHING LINK TO 127.0.0.1:3000…</p>
        {/* Animated bars */}
        <div className="flex justify-center gap-1">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-qos-danger"
              style={{
                height: `${8 + Math.random() * 16}px`,
                opacity: 0.3 + Math.random() * 0.7,
                animation: `pulse ${0.5 + i * 0.1}s ease-in-out infinite alternate`,
              }}
            />
          ))}
        </div>
        <button
          onClick={reconnect}
          className="font-mono text-xs px-4 py-2 border border-qos-danger/50 text-qos-danger hover:bg-qos-danger/10 rounded-sm transition-colors tracking-widest"
        >
          FORCE RECONNECT
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <ScanlineOverlay />
      <ReconnectOverlay />

      <DashboardHeader />

      {/* ── Main responsive grid ───────────────────────────────────────── */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* Row 1: Metrics — always full width, flex-wrapping */}
        <MetricsGrid />

        {/* Row 2: Two-column on ≥lg, single column on mobile/tablet */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6">
          <EdgeExplorer />
          <TelemetryPanel />
        </div>

        {/* Row 3: Footer status bar */}
        <footer className="flex items-center justify-between pt-4 border-t border-qos-border">
          <span className="font-mono text-[10px] text-qos-muted tracking-widest">
            Q-OS COMMAND INTERFACE · v0.1.0-alpha
          </span>
          <span className="font-mono text-[10px] text-qos-muted">
            {new Date().getFullYear()} · ALL SYSTEMS NOMINAL
          </span>
        </footer>
      </main>
    </>
  );
}
