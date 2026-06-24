import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'CRDT Sync Protocol — Q-OS Docs' };

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
        <span className="text-gray-400">CRDT Sync Protocol</span>
      </div>

      <div className="mb-8 pb-8 border-b border-[#00d4ff]/10">
        <span className="font-mono-code text-[10px] uppercase tracking-widest text-[#00d4ff] bg-[#00d4ff]/10 border border-[#00d4ff]/20 px-2.5 py-1 rounded-full mb-4 inline-block">
          Architecture
        </span>
        <H1>CRDT Sync Protocol</H1>
        <P>
          In larger venues, you might deploy multiple Q-OS edge nodes (e.g., one at the entrance, one at the bar). These nodes must synchronize state without relying on a cloud backend.
        </P>
      </div>

      <H2 id="mdns">mDNS Peer Discovery</H2>
      <P>
        When a Q-OS node boots up, it broadcasts its presence over the local network using mDNS (Multicast DNS). Other nodes automatically discover it and establish a secure, peer-to-peer TCP connection. No manual IP configuration is required.
      </P>

      <H2 id="merge-strategy">Last-Write-Wins Merge Strategy</H2>
      <P>
        Q-OS employs a Last-Write-Wins (LWW) Conflict-Free Replicated Data Type (CRDT) for state synchronization. Every mutation in Sled is tagged with a highly precise logical timestamp. 
      </P>
      <P>
        When two nodes mutate the same key (e.g., <InlineCode>inventory:sku_0912</InlineCode>) while partitioned, they will exchange their transaction logs upon reconnection. The mutation with the highest logical timestamp "wins" and becomes the canonical state across the mesh.
      </P>

      <Callout type="warn">
        Because of the LWW strategy, you should avoid relying on absolute counter overwrites if multiple nodes might modify the same counter simultaneously offline. Instead, append to lists or use unique keys per node when possible.
      </Callout>

      <div className="flex items-center justify-between pt-8 border-t border-[#00d4ff]/10 mt-12">
        <Link href="/docs/architecture/websocket" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>WebSocket Telemetry</span>
        </Link>
        <Link href="/docs/sdk-reference" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span>qos-sdk Overview</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </article>
  );
}
