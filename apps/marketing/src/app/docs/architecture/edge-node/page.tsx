import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Edge Node (Rust Daemon) — Q-OS Docs' };

function H1({ children }: { children: React.ReactNode }) { return <h1 className="text-4xl font-black text-white tracking-tight mb-4 font-mono-code">{children}</h1>; }
function H2({ id, children }: { id: string; children: React.ReactNode }) { return <h2 id={id} className="text-2xl font-bold text-white mt-14 mb-4 scroll-mt-24 flex items-center gap-3"><span className="text-[#00d4ff] font-mono-code text-lg">#</span>{children}</h2>; }
function H3({ children }: { children: React.ReactNode }) { return <h3 className="text-lg font-bold text-gray-200 mt-8 mb-3">{children}</h3>; }
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
        <span className="text-gray-400">Edge Node</span>
      </div>

      <div className="mb-8 pb-8 border-b border-[#00d4ff]/10">
        <span className="font-mono-code text-[10px] uppercase tracking-widest text-[#00d4ff] bg-[#00d4ff]/10 border border-[#00d4ff]/20 px-2.5 py-1 rounded-full mb-4 inline-block">
          Architecture
        </span>
        <H1>Edge Node (Rust Daemon)</H1>
        <P>
          The Q-OS Edge Node (`qos-runtime`) is a single, statically compiled Rust binary. It orchestrates the entire lifecycle of a physical interaction: terminating HTTP/WebSocket connections, booting WASM sandboxes, managing state, and finding peers.
        </P>
      </div>

      <H2 id="pipeline">The Execution Pipeline</H2>
      <P>When a guest scans a QR code and submits an action via the Micro-UI, the request travels through a strict, linear pipeline:</P>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        {[
          { step: '1. Bootloader', desc: 'Actix-Web receives the REST request, decodes the payload, and validates API keys or rate limits.' },
          { step: '2. Sandbox Manager', desc: 'Wasmtime spins up a fresh, isolated memory sandbox. The requested WASM module is loaded from the LRU cache (or disk).' },
          { step: '3. Execution', desc: 'The `run` entry point is invoked. The module executes synchronously, using the `qos-sdk` to read/write state.' },
          { step: '4. State & Telemetry', desc: 'Changes are written atomically to Sled. The Telemetry engine broadcasts these changes over WebSocket to the Admin HUD.' },
        ].map((s, i) => (
          <div key={i} className="p-5 rounded-xl bg-[#111] border border-[#00d4ff]/10">
            <h4 className="text-white font-bold mb-2 font-mono-code text-sm">{s.step}</h4>
            <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>

      <H2 id="wasmtime">Wasmtime Sandboxing</H2>
      <P>
        We use the Bytecode Alliance's <InlineCode>Wasmtime</InlineCode> engine. Every module invocation receives a completely fresh memory space. This means a memory leak or panic in a community module <strong>cannot crash the daemon</strong> or corrupt another guest's session.
      </P>

      <H2 id="host-abi">Deny-by-Default Capability ABI</H2>
      <P>
        WASM modules are inherently sandboxed and have zero access to the host machine. To allow modules to do useful work, Q-OS provides a strict, capability-gated ABI.
      </P>
      <P>
        Modules cannot open sockets, read arbitrary files, or access the network. They can <strong>only</strong> call the functions exposed by the host (wrapped by the <InlineCode>qos-sdk</InlineCode> crate), which restricts them to reading and writing isolated Sled state keys.
      </P>
      <Callout type="warn">
        Because of this deny-by-default policy, you cannot use standard library network crates like `reqwest` inside a Q-OS WASM module. All side-effects must be mediated by the Sled state store.
      </Callout>

      <div className="flex items-center justify-between pt-8 border-t border-[#00d4ff]/10 mt-12">
        <Link href="/docs/architecture" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>System Overview</span>
        </Link>
        <Link href="/docs/architecture/sled" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span>Sled State Store</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </article>
  );
}
