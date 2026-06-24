import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Sled State Store — Q-OS Docs' };

function H1({ children }: { children: React.ReactNode }) { return <h1 className="text-4xl font-black text-white tracking-tight mb-4 font-mono-code">{children}</h1>; }
function H2({ id, children }: { id: string; children: React.ReactNode }) { return <h2 id={id} className="text-2xl font-bold text-white mt-14 mb-4 scroll-mt-24 flex items-center gap-3"><span className="text-[#00d4ff] font-mono-code text-lg">#</span>{children}</h2>; }
function P({ children }: { children: React.ReactNode }) { return <p className="text-gray-400 leading-7 mb-4">{children}</p>; }
function InlineCode({ children }: { children: React.ReactNode }) { return <code className="font-mono-code text-[#00d4ff] bg-[#00d4ff]/8 border border-[#00d4ff]/15 px-1.5 py-0.5 rounded text-sm">{children}</code>; }
function Callout({ type, children }: { type: 'tip' | 'warn' | 'info'; children: React.ReactNode }) {
  const styles = {
    tip:  { border: '#00ff41', bg: '#00ff41', icon: '💡', label: 'TIP' },
    warn: { border: '#ff7a2f', bg: '#ff7a2f', icon: '⚠️', label: 'WARNING' },
    info: { border: '#00d4ff', bg: '#00d4ff', icon: 'ℹ️', label: 'NOTE' },
  }[type];
  return (
    <div className="my-6 rounded-xl border p-4 pl-5 relative overflow-hidden" style={{ borderColor: styles.border + '35', background: styles.bg + '08' }}>
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: styles.border }} />
      <p className="font-mono-code text-[10px] uppercase tracking-widest mb-2" style={{ color: styles.border }}>{styles.icon} {styles.label}</p>
      <div className="text-gray-400 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default function Page() {
  return (
    <article>
      <div className="flex items-center gap-2 text-xs font-mono-code text-gray-700 mb-8">
        <Link href="/docs" className="hover:text-[#00d4ff] transition-colors">Docs</Link>
        <span>›</span>
        <Link href="/docs/architecture" className="hover:text-[#00d4ff] transition-colors">Architecture</Link>
        <span>›</span>
        <span className="text-gray-400">Sled State Store</span>
      </div>

      <div className="mb-8 pb-8 border-b border-[#00d4ff]/10">
        <span className="font-mono-code text-[10px] uppercase tracking-widest text-[#00d4ff] bg-[#00d4ff]/10 border border-[#00d4ff]/20 px-2.5 py-1 rounded-full mb-4 inline-block">
          Architecture
        </span>
        <H1>Sled State Store</H1>
        <P>
          Q-OS uses <InlineCode>sled</InlineCode> as its primary embedded database. Sled is a high-performance, embedded, lock-free Bw-Tree. It acts as the single source of truth for edge node state.
        </P>
      </div>

      <H2 id="why-sled">Why Sled over SQLite?</H2>
      <P>
        While SQLite is the gold standard for embedded databases, Q-OS opts for Sled due to its raw Key-Value performance and lock-free concurrency model. WASM modules execute extremely quickly (often under 2ms). A relational query engine adds unnecessary overhead when modules only need rapid byte-array retrieval and atomic CAS (Compare-And-Swap) operations for state counters.
      </P>

      <H2 id="namespaces">Key Namespace Conventions</H2>
      <P>
        Because Sled is a flat Key-Value store, Q-OS enforces logical separation via prefixing. WASM modules should use predictable, namespaced keys to avoid collisions.
      </P>
      <div className="p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg font-mono text-sm text-gray-300 mb-6 space-y-2">
        <div><span className="text-gray-500">guestbook:</span>visits:total <span className="text-[#00ff41]">// Global counter</span></div>
        <div><span className="text-gray-500">inventory:</span>sku_0912:stock <span className="text-[#00ff41]">// SKU stock</span></div>
        <div><span className="text-gray-500">vip:</span>tokens:a7f92b... <span className="text-[#00ff41]">// Consumed token hash</span></div>
      </div>

      <H2 id="atomicity">Atomic Operations</H2>
      <P>
        Physical events happen concurrently. Ten people might scan a QR code simultaneously. Q-OS guarantees that <InlineCode>qos_sdk::state::set</InlineCode> operations are handled sequentially by Sled's transaction engine, ensuring no race conditions occur when incrementing counters or decrementing inventory.
      </P>
      <Callout type="tip">
        Every state mutation automatically triggers a `STATE_MUTATION` WebSocket event to connected Admin dashboards, ensuring the UI is always perfectly in sync with the physical world.
      </Callout>

      <div className="flex items-center justify-between pt-8 border-t border-[#00d4ff]/10 mt-12">
        <Link href="/docs/architecture/edge-node" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>Edge Node</span>
        </Link>
        <Link href="/docs/architecture/websocket" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span>WebSocket Telemetry</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </article>
  );
}
