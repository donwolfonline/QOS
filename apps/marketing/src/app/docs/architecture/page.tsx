import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Architecture — Q-OS Docs',
  description: 'A deep-dive into the Q-OS system architecture: the Rust edge daemon, Sled state store, WASM sandbox, WebSocket telemetry, and CRDT sync protocol.',
};

const LAYERS = [
  {
    title: 'Edge Node (Rust Daemon)',
    href: '/docs/architecture/edge-node',
    tag: 'qos-api',
    color: '#ff7a2f',
    desc: 'The heart of Q-OS. A single Actix-Web binary that owns the local Sled database, executes WASM modules in a sandboxed Wasmtime runtime, and streams telemetry over WebSocket.',
  },
  {
    title: 'Sled State Store',
    href: '/docs/architecture/sled',
    tag: 'K/V · Local-First',
    color: '#00d4ff',
    desc: 'An embedded, ACID-compliant key-value store. All state is written to disk atomically. No external database, no SQLite — Sled lives inside the daemon process itself.',
  },
  {
    title: 'WebSocket Telemetry Stream',
    href: '/docs/architecture/websocket',
    tag: '/api/v1/stream',
    color: '#00ff41',
    desc: 'A persistent WebSocket endpoint that broadcasts every STATE_MUTATION, EXECUTION_RECEIPT, and SYSTEM_BROADCAST event as NDJSON in real time.',
  },
  {
    title: 'CRDT Sync Protocol',
    href: '/docs/architecture/crdt',
    tag: 'mDNS · Mesh',
    color: '#c792ea',
    desc: 'When multiple edge nodes are on the same LAN, they discover each other via mDNS and synchronize state using a conflict-free replicated data type (CRDT) merge strategy.',
  },
];

export default function ArchitecturePage() {
  return (
    <article>
      <div className="flex items-center gap-2 text-xs font-mono-code text-gray-700 mb-8">
        <Link href="/docs" className="hover:text-[#00d4ff] transition-colors">Docs</Link>
        <span>›</span>
        <span className="text-gray-400">Architecture</span>
      </div>

      <div className="mb-10 pb-10 border-b border-[#00d4ff]/10">
        <span className="font-mono-code text-[10px] uppercase tracking-widest text-[#00d4ff] bg-[#00d4ff]/10 border border-[#00d4ff]/20 px-2.5 py-1 rounded-full mb-4 inline-block">
          Architecture
        </span>
        <h1 className="text-4xl font-black text-white tracking-tight mb-4 font-mono-code">System Overview</h1>
        <p className="text-gray-400 leading-7">
          Q-OS is a layered, local-first compute platform. Every component is designed to
          operate independently of the internet. The four core layers below interact over
          in-process function calls and LAN sockets — never cloud APIs.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {LAYERS.map((l, i) => (
          <Link key={l.title} href={l.href}
            className="group p-7 rounded-2xl bg-[#111] border border-[#00d4ff]/10 hover:border-[#00d4ff]/28 hover:-translate-y-0.5 transition-all duration-200 flex items-start gap-6">
            <span className="font-mono-code text-4xl font-black opacity-20 shrink-0 mt-1" style={{ color: l.color }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-lg font-bold text-white group-hover:text-[#00d4ff] transition-colors">{l.title}</h2>
                <span className="font-mono-code text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border"
                  style={{ color: l.color, borderColor: l.color + '40', background: l.color + '10' }}>
                  {l.tag}
                </span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">{l.desc}</p>
            </div>
            <span className="text-gray-700 group-hover:text-[#00d4ff] transition-colors text-xl shrink-0 mt-1">→</span>
          </Link>
        ))}
      </div>

      <div className="mt-12 p-6 rounded-xl border border-[#00ff41]/15 bg-[#00ff41]/5 text-center">
        <p className="text-sm text-gray-400 mb-4">Want to dive straight into code?</p>
        <Link href="/docs/quick-start" className="inline-block font-mono-code text-sm text-black bg-[#00ff41] px-6 py-2.5 rounded-lg font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(0,255,65,0.3)] hover:shadow-[0_0_35px_rgba(0,255,65,0.5)] transition-all">
          Read the Quick Start →
        </Link>
      </div>
    </article>
  );
}
