'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const DOC_NAV = [
  {
    category: 'Getting Started',
    icon: '⚡',
    color: '#00ff41',
    items: [
      { label: 'Introduction', href: '/docs' },
      { label: 'Quick Start', href: '/docs/quick-start' },
      { label: 'Installation', href: '/docs/installation' },
      { label: 'Your First Module', href: '/docs/first-module' },
    ],
  },
  {
    category: 'Architecture',
    icon: '🏗️',
    color: '#00d4ff',
    items: [
      { label: 'System Overview', href: '/docs/architecture' },
      { label: 'Edge Node (Rust Daemon)', href: '/docs/architecture/edge-node' },
      { label: 'Sled State Store', href: '/docs/architecture/sled' },
      { label: 'WebSocket Telemetry', href: '/docs/architecture/websocket' },
      { label: 'CRDT Sync Protocol', href: '/docs/architecture/crdt' },
    ],
  },
  {
    category: 'qos-sdk Reference',
    icon: '📦',
    color: '#facc15',
    items: [
      { label: 'Overview', href: '/docs/sdk-reference' },
      { label: 'qos_abi::read_input', href: '/docs/sdk-reference/read-input' },
      { label: 'qos_abi::write_output', href: '/docs/sdk-reference/write-output' },
      { label: 'qos_abi::state_get', href: '/docs/sdk-reference/state-get' },
      { label: 'qos_abi::state_set', href: '/docs/sdk-reference/state-set' },
      { label: 'Error Handling', href: '/docs/sdk-reference/errors' },
    ],
  },
  {
    category: 'WASM Module Guides',
    icon: '🧩',
    color: '#ff7a2f',
    items: [
      { label: 'Overview', href: '/docs/wasm-guides' },
      { label: 'Guest Check-In Module', href: '/docs/wasm-guides/guestbook' },
      { label: 'Menu & Ordering', href: '/docs/wasm-guides/menu' },
      { label: 'VIP Validation', href: '/docs/wasm-guides/vip' },
      { label: 'Inventory Sync', href: '/docs/wasm-guides/inventory' },
      { label: 'Custom Broadcast Logic', href: '/docs/wasm-guides/broadcast' },
    ],
  },
];

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`block px-3 py-1.5 rounded-lg text-sm font-mono-code transition-all duration-150 ${
        isActive
          ? 'bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/25'
          : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
      }`}
    >
      {isActive && <span className="text-[#00ff41] mr-1.5">›</span>}
      {label}
    </Link>
  );
}

export function DocsSidebar({ onOpenSearch }: { onOpenSearch?: () => void }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (cat: string) => setCollapsed(p => ({ ...p, [cat]: !p[cat] }));

  return (
    <aside className="w-64 shrink-0 h-full flex flex-col gap-2 py-8 pr-4 overflow-y-auto">
      {/* Logo lockup */}
      <div className="mb-6 px-3">
        <Link href="/" className="flex items-center gap-2 group mb-1">
          <div className="w-6 h-6 flex items-center justify-center border border-[#00ff41]/50 rounded group-hover:border-[#00ff41] transition-colors">
            <span className="font-mono-code text-[#00ff41] text-[10px] font-black">Q</span>
          </div>
          <span className="font-mono-code text-white text-sm font-bold tracking-widest group-hover:text-[#00ff41] transition-colors">Q-OS</span>
        </Link>
        <div className="flex items-center gap-2 pl-8">
          <span className="text-[10px] font-mono-code text-gray-600 uppercase tracking-widest">Docs</span>
          <span className="text-[10px] font-mono-code text-[#00ff41]/50 bg-[#00ff41]/10 px-1.5 py-0.5 rounded">v0.1.0</span>
        </div>
      </div>

      {/* Search box */}
      <div 
        onClick={onOpenSearch}
        className="mx-3 mb-4 flex items-center gap-2 bg-[#111] border border-[#00d4ff]/15 rounded-lg px-3 py-2 hover:border-[#00d4ff]/35 transition-colors cursor-pointer"
      >
        <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
        </svg>
        <span className="font-mono-code text-gray-600 text-xs">Search docs...</span>
        <span className="ml-auto font-mono-code text-gray-700 text-[10px] border border-gray-700 rounded px-1">⌘K</span>
      </div>

      {/* Nav categories */}
      <nav className="flex flex-col gap-1 px-1">
        {DOC_NAV.map(section => {
          const isOpen = !collapsed[section.category];
          return (
            <div key={section.category} className="mb-3">
              <button
                onClick={() => toggle(section.category)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/3 transition-colors group"
              >
                <span className="text-sm">{section.icon}</span>
                <span
                  className="font-mono-code text-[11px] uppercase tracking-widest font-bold flex-1 text-left"
                  style={{ color: section.color }}
                >
                  {section.category}
                </span>
                <motion.span
                  animate={{ rotate: isOpen ? 90 : 0 }}
                  className="text-gray-700 text-xs"
                >›</motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-2 mt-1 pl-3 border-l border-[#00d4ff]/10 flex flex-col gap-0.5">
                      {section.items.map(item => (
                        <NavItem key={item.href} {...item} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="mt-auto px-3 pt-6 border-t border-[#00d4ff]/10 flex flex-col gap-2">
        <a href="https://github.com/donwolfonline/QOS" className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-400 font-mono-code transition-colors">
          <span>⬡</span> GitHub ↗
        </a>
        <Link href="/developers" className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#00ff41] font-mono-code transition-colors">
          <span>▶</span> API Reference
        </Link>
      </div>
    </aside>
  );
}
