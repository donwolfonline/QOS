"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const MeshRadarGraph = dynamic(() => import('./MeshRadarGraph'), { ssr: false });

export default function MeshRadarPage() {
  return (
    <div className="h-screen w-screen bg-[#0a0a0a] flex flex-col font-sans text-gray-200 overflow-hidden select-none">
      {/* Header Bar */}
      <div className="flex-none flex items-center justify-between border-b border-[#00d4ff]/20 px-6 py-4 bg-[#121212] relative z-10 shadow-[0_0_15px_rgba(0,212,255,0.05)]">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent opacity-50" />
        
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 rounded border border-[#00d4ff]/50 flex items-center justify-center shadow-[0_0_10px_rgba(0,212,255,0.2)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="3"></circle>
              <line x1="12" y1="2" x2="12" y2="9"></line>
              <line x1="12" y1="15" x2="12" y2="22"></line>
              <line x1="2" y1="12" x2="9" y2="12"></line>
              <line x1="15" y1="12" x2="22" y2="12"></line>
            </svg>
          </div>
          <h1 className="text-xl font-bold font-mono tracking-widest text-[#00d4ff] uppercase hidden sm:block">
            Global Mesh Radar
          </h1>
        </div>

        <div className="flex items-center space-x-6 text-xs font-mono">
          <div className="flex items-center space-x-2 border border-[#00ff41]/30 px-3 py-1.5 rounded-full bg-[#00ff41]/10">
            <span className="uppercase tracking-widest text-[#00ff41] font-bold">Scanning</span>
            <span className="w-2 h-2 rounded-full bg-[#00ff41] animate-ping shadow-[0_0_8px_#00ff41]" />
          </div>
        </div>
      </div>

      {/* Radar Viewport */}
      <div className="flex-1 relative w-full h-full">
        {/* Background grid overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(0,212,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <MeshRadarGraph />
      </div>
    </div>
  );
}
