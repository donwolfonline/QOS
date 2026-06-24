'use client';

import { useState } from 'react';
import Link from 'next/link';
import { type Module, CATEGORY_COLORS } from '@/lib/registry-data';

export default function ModuleDetailClient({ mod }: { mod: Module }) {
  const installCmd = `qos install module ${mod.slug}`;
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'install' | 'changelog'>('overview');

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="relative w-full bg-[#0f0f0f] border rounded-2xl overflow-hidden flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.5)]"
      style={{ borderColor: mod.color + '35' }}
    >
      {/* Top glow */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${mod.color}80, transparent)` }} />

      {/* Header */}
      <div className="p-6 sm:p-10 border-b flex flex-col sm:flex-row items-start sm:items-center gap-6" style={{ borderColor: mod.color + '20' }}>
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl shrink-0 border shadow-lg"
          style={{ background: mod.color + '12', borderColor: mod.color + '30', boxShadow: `0 0 40px ${mod.color}15` }}>
          {mod.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1 className="text-3xl sm:text-4xl font-black text-white font-mono-code">{mod.name}</h1>
            {mod.verified && (
              <span className="text-[#00ff41] text-sm font-medium" title="Verified by Q-OS Team">✓ Official</span>
            )}
            <span className="font-mono-code text-xs px-3 py-1 rounded-full border uppercase tracking-widest"
              style={{ color: CATEGORY_COLORS[mod.category], borderColor: CATEGORY_COLORS[mod.category] + '40', background: CATEGORY_COLORS[mod.category] + '12' }}>
              {mod.category}
            </span>
          </div>
          <p className="text-gray-400 font-mono-code text-sm">by {mod.author} · v{mod.version} · {mod.license}</p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 border-b divide-x" style={{ borderColor: mod.color + '15', '--tw-divide-opacity': 1 } as React.CSSProperties}>
        {[
          { label: 'CPU', value: mod.cpu },
          { label: 'RAM', value: mod.ram },
          { label: 'Downloads', value: mod.downloads },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center py-5 gap-1" style={{ borderColor: mod.color + '15' }}>
            <span className="font-mono-code text-2xl font-bold" style={{ color: mod.color }}>{s.value}</span>
            <span className="font-mono-code text-xs uppercase tracking-widest text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: mod.color + '15' }}>
        {(['overview', 'install', 'changelog'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 font-mono-code text-sm uppercase tracking-widest transition-colors ${
              activeTab === tab ? 'border-b-2 font-bold' : 'text-gray-600 hover:text-gray-400'
            }`}
            style={activeTab === tab ? { color: mod.color, borderColor: mod.color } : {}}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6 sm:p-10 min-h-[300px]">
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            <p className="text-gray-300 leading-relaxed text-base sm:text-lg">{mod.longDescription}</p>
            <div className="flex flex-wrap gap-2">
              {mod.tags.map(t => (
                <span key={t} className="font-mono-code text-xs text-gray-400 border border-gray-800 px-3 py-1.5 rounded-full bg-[#111]">#{t}</span>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'install' && (
          <div className="flex flex-col gap-8 max-w-2xl mx-auto">
            <p className="text-gray-300 text-base leading-relaxed text-center">
              Install directly from the <span className="text-[#00d4ff] font-mono-code bg-[#00d4ff]/10 px-1.5 py-0.5 rounded">qos</span> CLI on your edge node:
            </p>
            {/* Install command */}
            <div className="rounded-xl bg-[#050505] border overflow-hidden shadow-2xl" style={{ borderColor: mod.color + '25' }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-[#111]" style={{ borderColor: mod.color + '15' }}>
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#ff003c]/70" />
                  <span className="w-3 h-3 rounded-full bg-[#facc15]/70" />
                  <span className="w-3 h-3 rounded-full bg-[#00ff41]/70" />
                </div>
                <span className="font-mono-code text-xs text-gray-500 flex-1 text-center">qos cli</span>
                <button onClick={() => copy(installCmd)}
                  className={`font-mono-code text-xs px-3 py-1.5 rounded border transition-all ${copied ? 'text-[#00ff41] border-[#00ff41]/30 bg-[#00ff41]/10' : 'text-gray-400 border-gray-700 hover:text-gray-200 hover:border-gray-500'}`}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div className="p-6 flex items-center gap-4">
                <span className="text-[#00d4ff] font-mono-code text-lg">$</span>
                <span className="font-mono-code text-lg" style={{ color: mod.color }}>{installCmd}</span>
              </div>
            </div>

            {/* Steps */}
            <div className="flex flex-col gap-6">
              {[
                { step: '1', title: 'Run the install command above on your edge node.', detail: `The qos CLI fetches ${mod.slug} from the module registry and writes the .wasm binary to ~/.qos/modules/.` },
                { step: '2', title: 'Assign it to a table or zone.', detail: `qos link --table 4 --module ${mod.slug.split('/')[1]}` },
                { step: '3', title: 'Verify it is active.', detail: 'qos module list → should show status: ACTIVE beside the module name.' },
              ].map(s => (
                <div key={s.step} className="flex gap-5 items-start">
                  <div className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5"
                    style={{ borderColor: mod.color + '40', background: mod.color + '10' }}>
                    <span className="font-mono-code text-sm font-bold" style={{ color: mod.color }}>{s.step}</span>
                  </div>
                  <div>
                    <p className="text-white text-base font-medium mb-1">{s.title}</p>
                    <code className="font-mono-code text-sm text-gray-500">{s.detail}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'changelog' && (
          <div className="flex flex-col gap-4">
            {mod.changelog.split('\\n').map((line, i) => {
              const [ver, ...rest] = line.split(' — ');
              return (
                <div key={i} className="flex gap-4 items-start p-5 rounded-xl bg-[#111] border border-[#00d4ff]/10">
                  <span className="font-mono-code text-sm font-bold shrink-0" style={{ color: mod.color }}>v{ver}</span>
                  <span className="text-gray-300 text-base">{rest.join(' — ')}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="p-6 sm:p-8 border-t flex flex-col sm:flex-row gap-4 bg-[#0a0a0a]" style={{ borderColor: mod.color + '20' }}>
        <button onClick={() => { setActiveTab('install'); }}
          className="flex-1 py-4 font-mono-code text-base font-bold text-black rounded-xl tracking-widest uppercase transition-all hover:opacity-90 active:scale-95 text-center"
          style={{ background: mod.color, boxShadow: `0 0 30px ${mod.color}30` }}>
          Install Module
        </button>
        <Link href="/docs/wasm-guides"
          className="px-8 py-4 font-mono-code text-base text-gray-400 border border-gray-800 rounded-xl hover:border-gray-500 hover:text-white transition-colors text-center bg-[#111]">
          Read the Docs →
        </Link>
      </div>
    </div>
  );
}
