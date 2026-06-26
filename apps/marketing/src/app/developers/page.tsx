'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const INSTALL_STEPS = [
  { cmd: 'curl -sL https://q-os.io/install | bash', out: '[OK] Binary installed to /usr/local/bin/qos. Ed25519 keypair generated.' },
  { cmd: 'qos start', out: '[MESH] mDNS Discovery Active. Found 2 Peers on local subnet.' },
  { cmd: 'qos module deploy ./my_module.qos --name heartbeat-agent', out: '[WASM] Module signed & registered. Invoke at /api/v1/invoke/heartbeat-agent' },
];

const API_ENDPOINTS = [
  { method: 'GET',    path: '/api/v1/state/dump',           desc: 'Dump all Sled K/V state as JSON',             auth: false },
  { method: 'POST',   path: '/api/v1/state/edit',            desc: 'Mutate a namespace key in the Sled store',    auth: true  },
  { method: 'POST',   path: '/api/v1/invoke/:module',        desc: 'Execute a loaded WASM module',                auth: true  },
  { method: 'POST',   path: '/api/v1/broadcast',             desc: 'Push system message to all connected clients',auth: true  },
  { method: 'GET',    path: '/api/v1/stream',                desc: 'WebSocket: live NDJSON telemetry stream',     auth: false },
  { method: 'GET',    path: '/api/v1/health',                desc: 'Node health, peer count & uptime',            auth: false },
];

const methodColor: Record<string, string> = {
  GET: '#00ff41',
  POST: '#00d4ff',
  DELETE: '#ff003c',
};

const TECH_BADGES = [
  { label: 'Rust', color: '#ff7a2f', icon: '🦀' },
  { label: 'WASM', color: '#7c3aed', icon: '⚡' },
  { label: 'libp2p', color: '#00d4ff', icon: '🌐' },
  { label: 'Sled DB', color: '#00ff41', icon: '💾' },
  { label: 'Gossipsub', color: '#ff003c', icon: '📡' },
  { label: 'Ed25519', color: '#facc15', icon: '🔑' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 100 } }
};

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-32 px-6 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 right-[-15%] w-[700px] h-[600px] bg-[#00ff41]/5 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-[-10%] w-[600px] h-[500px] bg-[#7c3aed]/5 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-5xl mx-auto relative z-10">

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00ff41]/20 bg-[#00ff41]/5 mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#00ff41] animate-pulse"></span>
            <span className="font-mono-code text-[#00ff41] text-[11px] tracking-widest uppercase">For Engineers</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
            Ship faster.<br /><span className="text-gradient-blue">Own the stack.</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl leading-relaxed mb-10">
            Q-OS is a Rust-first edge runtime with a dead-simple WASM SDK, a live WebSocket
            telemetry stream, and a RESTful API you can hit with <code className="font-mono-code text-[#00d4ff] text-base">curl</code>. No proprietary SDK lock-in. No vendor fees.
          </p>

          {/* Tech Badges */}
          <div className="flex flex-wrap gap-2">
            {TECH_BADGES.map((b) => (
              <motion.span
                key={b.label}
                whileHover={{ scale: 1.08, y: -2 }}
                className="flex items-center gap-1.5 font-mono-code text-[11px] px-3 py-1.5 rounded-full border backdrop-blur-md cursor-default transition-all"
                style={{ color: b.color, borderColor: b.color + '30', background: b.color + '0d' }}
              >
                {b.icon} {b.label}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Install sequence */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-24"
        >
          <h2 className="text-2xl font-bold text-white mb-8">
            <span className="text-[#00ff41] font-mono-code mr-3">01.</span> Install in 60 seconds
          </h2>
          <div className="rounded-2xl bg-[#050505] border border-[#00ff41]/15 overflow-hidden shadow-[0_0_60px_rgba(0,255,65,0.06)] backdrop-blur-xl">
            {/* Window chrome */}
            <div className="bg-[#0d0d0d] px-5 py-3 border-b border-white/5 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff003c]/80" />
              <span className="w-3 h-3 rounded-full bg-[#facc15]/80" />
              <span className="w-3 h-3 rounded-full bg-[#00ff41]/80" />
              <span className="mx-auto font-mono-code text-[10px] text-[#00ff41]/40 tracking-widest uppercase">root@qos-edge-01:~</span>
            </div>
            {/* Scanlines overlay */}
            <div className="scanlines p-7 flex flex-col gap-5">
              {INSTALL_STEPS.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.2 }}
                  className="flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[#00d4ff] font-mono-code text-sm select-none">$</span>
                    <code className="font-mono-code text-white text-sm">{s.cmd}</code>
                  </div>
                  <div className="flex items-start gap-2.5 pl-5">
                    <span className="text-gray-700 font-mono-code text-sm select-none">›</span>
                    <code className="font-mono-code text-[#00ff41] text-sm leading-relaxed">{s.out}</code>
                  </div>
                </motion.div>
              ))}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[#00d4ff] font-mono-code text-sm select-none">$</span>
                <span className="w-2.5 h-5 bg-[#00ff41] animate-blink inline-block" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* API Reference */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-24"
        >
          <h2 className="text-2xl font-bold text-white mb-8">
            <span className="text-[#00d4ff] font-mono-code mr-3">02.</span> REST API Reference
          </h2>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden divide-y divide-white/5 backdrop-blur-xl"
          >
            {API_ENDPOINTS.map((ep) => (
              <motion.div
                key={ep.path}
                variants={itemVariants}
                className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors group"
              >
                <span
                  className="font-mono-code text-xs font-bold tracking-widest w-14 shrink-0"
                  style={{ color: methodColor[ep.method] }}
                >
                  {ep.method}
                </span>
                <code className="font-mono-code text-[#00d4ff] text-sm flex-1 group-hover:text-white transition-colors">{ep.path}</code>
                <span className="text-gray-600 text-sm hidden md:block flex-1 group-hover:text-gray-400 transition-colors">{ep.desc}</span>
                {ep.auth && (
                  <span className="font-mono-code text-[10px] text-[#ff003c]/70 border border-[#ff003c]/20 px-2 py-0.5 rounded-full shrink-0">
                    🔒 Auth
                  </span>
                )}
              </motion.div>
            ))}
          </motion.div>
          <p className="mt-4 text-gray-600 text-sm font-mono-code">
            Auth: pass <code className="text-[#00d4ff]">x-qos-api-key: &lt;your-key&gt;</code> header on protected routes.
          </p>
        </motion.div>

        {/* WASM SDK callout */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20 p-8 rounded-2xl border border-[#00ff41]/20 bg-white/[0.02] backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[80px] bg-[#00ff41]/10 pointer-events-none" />
          <h2 className="text-2xl font-bold text-white mb-3 relative z-10">
            <span className="text-[#00ff41] font-mono-code mr-3">03.</span> Write a WASM Module
          </h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed relative z-10">
            Any language that compiles to WASM is supported. The host exposes a minimal ABI via
            {' '}<code className="font-mono-code text-[#00d4ff]">host::state_get</code>,{' '}
            <code className="font-mono-code text-[#00d4ff]">host::state_set</code>, and{' '}
            <code className="font-mono-code text-[#00d4ff]">host::log</code>. Rust, Go, Zig — your choice.
          </p>
          <pre className="font-mono-code text-sm bg-[#030303] rounded-xl p-6 overflow-x-auto border border-[#00ff41]/10 relative z-10">
            <code className="text-[#00ff41]">{`use qos_sdk::{state, gossip, input, output};

#[no_mangle]
pub extern "C" fn run() {
    let raw = input::read();
    let count: u64 = state::get("visits")
        .and_then(|b| String::from_utf8(b).ok())
        .and_then(|s| s.parse().ok())
        .unwrap_or(0) + 1;

    state::set("visits", count.to_string().as_bytes());
    gossip::publish("metrics", &count.to_le_bytes());

    output::write(
        serde_json::json!({ "ok": true, "visits": count })
            .to_string().as_bytes()
    );
}`}</code>
          </pre>
        </motion.div>

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-center gap-4 justify-center"
        >
          <Link
            href="/pricing"
            className="px-10 py-4 font-bold font-mono-code text-black bg-gradient-to-r from-[#00ff41] to-[#00d4ff] rounded-xl tracking-widest uppercase shadow-[0_0_30px_rgba(0,255,65,0.35)] hover:shadow-[0_0_50px_rgba(0,255,65,0.5)] hover:scale-105 transition-all"
          >
            Start Building — Free
          </Link>
          <a
            href="/docs"
            className="font-mono-code text-sm text-gray-400 hover:text-[#00d4ff] tracking-widest transition-colors border border-white/10 px-6 py-4 rounded-xl hover:border-[#00d4ff]/30 hover:bg-[#00d4ff]/5 backdrop-blur-md"
          >
            Read the Docs ↗
          </a>
        </motion.div>
      </div>
    </div>
  );
}
