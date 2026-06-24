import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'WebSocket Telemetry — Q-OS Docs' };

function H1({ children }: { children: React.ReactNode }) { return <h1 className="text-4xl font-black text-white tracking-tight mb-4 font-mono-code">{children}</h1>; }
function H2({ id, children }: { id: string; children: React.ReactNode }) { return <h2 id={id} className="text-2xl font-bold text-white mt-14 mb-4 scroll-mt-24 flex items-center gap-3"><span className="text-[#00d4ff] font-mono-code text-lg">#</span>{children}</h2>; }
function P({ children }: { children: React.ReactNode }) { return <p className="text-gray-400 leading-7 mb-4">{children}</p>; }
function InlineCode({ children }: { children: React.ReactNode }) { return <code className="font-mono-code text-[#00d4ff] bg-[#00d4ff]/8 border border-[#00d4ff]/15 px-1.5 py-0.5 rounded text-sm">{children}</code>; }

export default function Page() {
  return (
    <article>
      <div className="flex items-center gap-2 text-xs font-mono-code text-gray-700 mb-8">
        <Link href="/docs" className="hover:text-[#00d4ff] transition-colors">Docs</Link>
        <span>›</span>
        <Link href="/docs/architecture" className="hover:text-[#00d4ff] transition-colors">Architecture</Link>
        <span>›</span>
        <span className="text-gray-400">WebSocket Telemetry</span>
      </div>

      <div className="mb-8 pb-8 border-b border-[#00d4ff]/10">
        <span className="font-mono-code text-[10px] uppercase tracking-widest text-[#00d4ff] bg-[#00d4ff]/10 border border-[#00d4ff]/20 px-2.5 py-1 rounded-full mb-4 inline-block">
          Architecture
        </span>
        <H1>WebSocket Telemetry</H1>
        <P>
          Q-OS is designed to operate offline, but when a network is available, it provides a high-performance WebSocket telemetry stream at <InlineCode>/api/v1/stream</InlineCode>. This powers the Admin HUD with zero-latency updates.
        </P>
      </div>

      <H2 id="ndjson">NDJSON Event Formats</H2>
      <P>
        Events are streamed as Newline-Delimited JSON (NDJSON) over the WebSocket. There are three primary event types:
      </P>

      <div className="space-y-6 mt-6">
        <div className="p-5 bg-[#111] border border-[#00d4ff]/10 rounded-xl">
          <h3 className="font-mono-code text-[#00d4ff] text-sm mb-2">1. STATE_MUTATION</h3>
          <p className="text-gray-400 text-sm mb-4">Fired whenever a WASM module calls <InlineCode>qos_sdk::state::set</InlineCode>.</p>
          <pre className="text-xs font-mono text-gray-300 bg-black p-4 rounded-lg overflow-x-auto border border-gray-800">
{`{
  "type": "STATE_MUTATION",
  "key": "guestbook:visits:total",
  "old_value": [42],
  "new_value": [43],
  "timestamp": 1718223401000
}`}
          </pre>
        </div>

        <div className="p-5 bg-[#111] border border-[#00d4ff]/10 rounded-xl">
          <h3 className="font-mono-code text-[#ff7a2f] text-sm mb-2">2. EXECUTION_RECEIPT</h3>
          <p className="text-gray-400 text-sm mb-4">Fired when a WASM module successfully completes execution and returns a receipt.</p>
          <pre className="text-xs font-mono text-gray-300 bg-black p-4 rounded-lg overflow-x-auto border border-gray-800">
{`{
  "type": "EXECUTION_RECEIPT",
  "module_id": "@official/guestbook",
  "latency_ms": 1.2,
  "receipt": { "status": "checked_in", "guest": "Alice" },
  "timestamp": 1718223401001
}`}
          </pre>
        </div>

        <div className="p-5 bg-[#111] border border-[#00d4ff]/10 rounded-xl">
          <h3 className="font-mono-code text-[#00ff41] text-sm mb-2">3. SYSTEM_BROADCAST</h3>
          <p className="text-gray-400 text-sm mb-4">Fired explicitly by a module using the broadcast ABI (e.g. for low inventory alerts).</p>
          <pre className="text-xs font-mono text-gray-300 bg-black p-4 rounded-lg overflow-x-auto border border-gray-800">
{`{
  "type": "SYSTEM_BROADCAST",
  "level": "WARNING",
  "message": "SKU_0912 stock is below 5 units",
  "timestamp": 1718223401005
}`}
          </pre>
        </div>
      </div>

      <div className="flex items-center justify-between pt-8 border-t border-[#00d4ff]/10 mt-12">
        <Link href="/docs/architecture/sled" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>Sled State Store</span>
        </Link>
        <Link href="/docs/architecture/crdt" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span>CRDT Sync Protocol</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </article>
  );
}
