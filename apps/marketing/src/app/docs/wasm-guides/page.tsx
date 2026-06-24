import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WASM Module Guides — Q-OS Docs',
  description: 'Practical, production-ready guides for building Q-OS WASM modules: guestbook check-in, menu ordering, VIP validation, inventory sync, and custom broadcast logic.',
};

const GUIDES = [
  { href: '/docs/wasm-guides/guestbook', icon: '📋', title: 'Guest Check-In Module', tag: 'Beginner', color: '#00ff41', desc: 'The canonical Q-OS module. Collect a guest alias, persist a check-in counter, return a receipt with their check-in number.' },
  { href: '/docs/wasm-guides/menu', icon: '🍽️', title: 'Menu & Ordering', tag: 'Intermediate', color: '#00d4ff', desc: 'Render a dynamic menu from state, accept item selections, and write order objects to the Sled store for kitchen display.' },
  { href: '/docs/wasm-guides/vip', icon: '🎟️', title: 'VIP Validation', tag: 'Intermediate', color: '#facc15', desc: 'Pre-load a list of valid tokens into state, validate guest tokens on scan, and grant/deny access — zero cloud round-trips.' },
  { href: '/docs/wasm-guides/inventory', icon: '📦', title: 'Inventory Sync', tag: 'Advanced', color: '#ff7a2f', desc: 'Maintain a local SKU inventory in Sled. Decrement stock on scan, broadcast low-stock warnings, and sync across peer nodes.' },
  { href: '/docs/wasm-guides/broadcast', icon: '📡', title: 'Custom Broadcast Logic', tag: 'Advanced', color: '#c792ea', desc: 'Trigger SYSTEM_BROADCAST events from within WASM module logic — for flash promotions, last-call alerts, and staff notifications.' },
];

const TAG_COLORS: Record<string, string> = {
  Beginner: '#00ff41',
  Intermediate: '#00d4ff',
  Advanced: '#ff7a2f',
};

export default function WasmGuidesPage() {
  return (
    <article>
      <div className="flex items-center gap-2 text-xs font-mono-code text-gray-700 mb-8">
        <Link href="/docs" className="hover:text-[#00d4ff] transition-colors">Docs</Link>
        <span>›</span>
        <span className="text-gray-400">WASM Module Guides</span>
      </div>

      <div className="mb-10 pb-10 border-b border-[#00d4ff]/10">
        <span className="font-mono-code text-[10px] uppercase tracking-widest text-[#ff7a2f] bg-[#ff7a2f]/10 border border-[#ff7a2f]/20 px-2.5 py-1 rounded-full mb-4 inline-block">
          WASM Guides
        </span>
        <h1 className="text-4xl font-black text-white tracking-tight mb-4 font-mono-code">WASM Module Guides</h1>
        <p className="text-gray-400 leading-7">
          Each guide walks you through a complete, production-ready WASM module from scratch.
          Start with the Guestbook to understand the Q-OS ABI, then explore the more advanced
          guides to build real venue logic.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {GUIDES.map(g => (
          <Link key={g.href} href={g.href}
            className="group p-6 rounded-2xl bg-[#111] border border-[#00d4ff]/10 hover:border-[#00d4ff]/28 hover:-translate-y-0.5 transition-all duration-200 flex items-start gap-5">
            <span className="text-3xl shrink-0 mt-0.5">{g.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h2 className="text-base font-bold text-white group-hover:text-[#00d4ff] transition-colors">{g.title}</h2>
                <span className="font-mono-code text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border"
                  style={{ color: TAG_COLORS[g.tag], borderColor: TAG_COLORS[g.tag] + '40', background: TAG_COLORS[g.tag] + '10' }}>
                  {g.tag}
                </span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">{g.desc}</p>
            </div>
            <span className="text-gray-700 group-hover:text-[#00d4ff] transition-colors text-xl shrink-0 mt-1">→</span>
          </Link>
        ))}
      </div>

      <div className="mt-14 p-6 rounded-xl border border-[#00d4ff]/15 bg-[#00d4ff]/5">
        <p className="font-mono-code text-[10px] uppercase tracking-widest text-[#00d4ff] mb-2">New to Q-OS?</p>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">
          If this is your first time here, start with the Quick Start guide to get a live
          node running before diving into specific module patterns.
        </p>
        <Link href="/docs/quick-start"
          className="inline-block font-mono-code text-xs text-[#00d4ff] border border-[#00d4ff]/30 px-4 py-2 rounded-lg hover:bg-[#00d4ff]/10 transition-colors">
          Read Quick Start →
        </Link>
      </div>
    </article>
  );
}
