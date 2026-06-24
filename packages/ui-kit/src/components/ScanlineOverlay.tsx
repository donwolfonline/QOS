'use client';
import React from 'react';

export function ScanlineOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 mix-blend-overlay"
      style={{
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0,255,65,0.015) 2px,
          rgba(0,255,65,0.015) 4px
        )`,
      }}
    />
  );
}
