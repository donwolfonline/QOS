import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Developers — For Engineers',
  description:
    'Q-OS is a Rust + WASM edge runtime with a WebSocket telemetry stream, CRDT state sync, and a full REST API. Build and deploy WASM modules in minutes.',
  openGraph: {
    title: 'Q-OS for Engineers',
    description: 'Rust edge runtime · WASM sandbox · CRDT state · WebSocket telemetry. Ship in minutes.',
    url: 'https://q-os.io/developers',
  },
};

const INSTALL_STEPS = [
  { cmd: '$ curl -sL https://q-os.io/install | bash', out: '> [OK] Downloading Rust Binary (qos-api v0.1.0)...' },
  { cmd: '$ qos start', out: '> [MESH] mDNS Discovery Active. Found 2 Peers.' },
  { cmd: '$ qos module deploy ./my_module.wasm --table 3', out: '> [WASM] Module registered. QR updated instantly.' },
];

const API_ENDPOINTS = [
  { method: 'GET',  path: '/api/v1/state/dump',      desc: 'Dump all Sled K/V state as JSON',         auth: false },
  { method: 'POST', path: '/api/v1/state/edit',       desc: 'Mutate a namespace key',                  auth: true  },
  { method: 'POST', path: '/api/v1/execute',          desc: 'Invoke a loaded WASM module',             auth: true  },
  { method: 'POST', path: '/api/v1/broadcast',        desc: 'Push system message to all clients',      auth: true  },
  { method: 'GET',  path: '/api/v1/stream',           desc: 'WebSocket: live NDJSON telemetry stream', auth: false },
  { method: 'GET',  path: '/api/v1/health',           desc: 'Node health + uptime check',              auth: false },
];

const methodColor: Record<string, string> = {
  GET: '#00ff41',
  POST: '#00d4ff',
  DELETE: '#ff003c',
};

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-32 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-20">
          <p className="font-mono-code text-[#00ff41] text-xs tracking-widest uppercase mb-4">&gt;_ For Engineers</p>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6">
            Ship faster.<br /><span className="text-gradient-blue">Own the stack.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
            Q-OS is a Rust-first edge runtime with a dead-simple WASM SDK, a live WebSocket
            telemetry stream, and a RESTful API you can hit with curl. No proprietary SDK
            lock-in. No vendor fees.
          </p>
        </div>

        {/* Install sequence */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8">
            <span className="text-[#00ff41] font-mono-code mr-2">01.</span> Install in 60 seconds
          </h2>
          <div className="rounded-2xl bg-[#050505] border border-[#00d4ff]/20 overflow-hidden shadow-[0_0_40px_rgba(0,212,255,0.06)]">
            {/* Window chrome */}
            <div className="bg-[#111111] px-5 py-3 border-b border-[#00d4ff]/15 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff003c]/80" />
              <span className="w-3 h-3 rounded-full bg-[#facc15]/80" />
              <span className="w-3 h-3 rounded-full bg-[#00ff41]/80" />
              <span className="mx-auto font-mono-code text-[10px] text-[#00d4ff]/50 tracking-widest uppercase">root@qos-edge-01:~</span>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {INSTALL_STEPS.map((s, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#00d4ff] font-mono-code text-sm">$</span>
                    <code className="font-mono-code text-white text-sm">{s.cmd.slice(2)}</code>
                  </div>
                  <div className="flex items-center gap-2 pl-4">
                    <span className="text-gray-600 font-mono-code text-sm">&gt;</span>
                    <code className="font-mono-code text-[#00ff41] text-sm">{s.out.slice(2)}</code>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[#00d4ff] font-mono-code text-sm">$</span>
                <span className="w-2 h-4 bg-[#00ff41] animate-pulse inline-block" />
              </div>
            </div>
          </div>
        </div>

        {/* API Reference */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8">
            <span className="text-[#00d4ff] font-mono-code mr-2">02.</span> REST API Reference
          </h2>
          <div className="rounded-2xl bg-[#111111] border border-[#00d4ff]/15 overflow-hidden divide-y divide-[#00d4ff]/10">
            {API_ENDPOINTS.map(ep => (
              <div key={ep.path} className="px-6 py-4 flex items-center gap-4 hover:bg-[#00d4ff]/3 transition-colors group">
                <span
                  className="font-mono-code text-xs font-bold tracking-widest w-14 shrink-0"
                  style={{ color: methodColor[ep.method] }}
                >
                  {ep.method}
                </span>
                <code className="font-mono-code text-[#00d4ff] text-sm flex-1">{ep.path}</code>
                <span className="text-gray-500 text-sm hidden md:block flex-1">{ep.desc}</span>
                {ep.auth && (
                  <span className="font-mono-code text-[10px] text-[#ff003c]/70 border border-[#ff003c]/20 px-2 py-0.5 rounded-full">
                    🔒 Auth
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 text-gray-600 text-sm font-mono-code">
            Auth: pass <code className="text-[#00d4ff]">x-qos-api-key: &lt;your-key&gt;</code> header on protected routes.
          </p>
        </div>

        {/* WASM SDK callout */}
        <div className="mb-20 p-8 rounded-2xl border border-[#00ff41]/20 bg-[#00ff41]/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl bg-[#00ff41]/10 pointer-events-none" />
          <h2 className="text-2xl font-bold text-white mb-3">
            <span className="text-[#00ff41] font-mono-code mr-2">03.</span> Write a WASM Module
          </h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Any language that compiles to WASM is supported. The host exposes a minimal
            ABI: read/write state keys, return a payload string. Rust, Go, Zig — your choice.
          </p>
          <pre className="font-mono-code text-sm bg-[#050505] rounded-xl p-5 overflow-x-auto border border-[#00ff41]/10">
            <code className="text-[#00ff41]">{`// lib.rs — minimal Q-OS WASM module
#[no_mangle]
pub extern "C" fn execute(input_ptr: *const u8, len: u32) -> *mut u8 {
    // Read guest input, write to state, return receipt
    let receipt = format!(r#"{{"status":"ok","msg":"Hello from WASM!"}}"#);
    qos_abi::write_output(receipt.as_bytes())
}`}</code>
          </pre>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
          <Link
            href="/pricing"
            className="px-10 py-4 font-bold font-mono-code text-black bg-[#00ff41] rounded-xl tracking-widest uppercase shadow-[0_0_30px_rgba(0,255,65,0.35)] hover:shadow-[0_0_50px_rgba(0,255,65,0.5)] hover:scale-105 transition-all"
          >
            Start Building — Free
          </Link>
          <a
            href="https://docs.q-os.io"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono-code text-sm text-gray-400 hover:text-[#00d4ff] tracking-widest transition-colors"
          >
            Read the Full Docs ↗
          </a>
        </div>
      </div>
    </div>
  );
}
