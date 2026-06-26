'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

// ─── Typing Effect ───────────────────────────────────────────────────────────
const PHRASES = [
  'Sub-millisecond Cold Starts.',
  'Unbreakable Mesh Synchronization.',
  'Write in Rust, Deploy Anywhere.',
  'Cryptographic Code Ownership.',
];
function TypingEffect() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const phrase = PHRASES[phraseIdx];
    const t = setTimeout(() => {
      if (!deleting && charIdx === phrase.length) setTimeout(() => setDeleting(true), 1800);
      else if (deleting && charIdx === 0) { setDeleting(false); setPhraseIdx(i => (i + 1) % PHRASES.length); }
      else setCharIdx(i => i + (deleting ? -1 : 1));
    }, deleting ? 25 : 55);
    return () => clearTimeout(t);
  }, [charIdx, deleting, phraseIdx]);
  return (
    <span className="font-mono-code text-[#00d4ff]">
      {PHRASES[phraseIdx].substring(0, charIdx)}<span className="animate-blink ml-0.5">▋</span>
    </span>
  );
}

// ─── Marquee Logos ────────────────────────────────────────────────────────────
const LOGOS = [
  { name: 'AWS', sub: 'Eliminated' },
  { name: 'Stripe', sub: 'Complementary' },
  { name: 'Vercel', sub: 'Optional' },
  { name: 'Supabase', sub: 'Replaced' },
  { name: 'Firebase', sub: 'Legacy' },
  { name: 'Railway', sub: 'Unnecessary' },
  { name: 'Fly.io', sub: 'Superfluous' },
  { name: 'PlanetScale', sub: 'Replaced' },
];

// ─── Value Props ──────────────────────────────────────────────────────────────
const VALUE_PROPS = [
  {
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="16" rx="2" stroke="#00ff41" strokeWidth="1.5"/>
        <path d="M10 16c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6" stroke="#00ff41" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="16" cy="16" r="2" fill="#00ff41"/>
      </svg>
    ),
    stat: 'WASM',
    statLabel: 'Universal Target',
    title: 'Write in Any Language (WASM)',
    body: 'Compile Rust, Go, AssemblyScript, or JS into tightly sandboxed WebAssembly modules. Execute safely on edge nodes with sub-millisecond cold starts.',
    color: '#00ff41',
  },
  {
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
        <path d="M8 16l8 8 8-8-8-8-8 8z" stroke="#00d4ff" strokeWidth="1.5"/>
        <path d="M8 16l8-8 8 8" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="3 2"/>
        <circle cx="8" cy="16" r="2" fill="#00d4ff"/>
        <circle cx="24" cy="16" r="2" fill="#00d4ff"/>
        <circle cx="16" cy="8" r="2" fill="#00d4ff"/>
        <circle cx="16" cy="24" r="2" fill="#00d4ff"/>
      </svg>
    ),
    stat: 'P2P',
    statLabel: 'Routing Protocol',
    title: 'Global DHT Discovery (libp2p)',
    body: 'Powered by libp2p and Kademlia DHT. Edge nodes discover each other instantly across NATs and firewalls. Unbreakable mesh synchronization without central coordination.',
    color: '#00d4ff',
  },
  {
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="#ff7a2f" strokeWidth="1.5" strokeDasharray="4 2" className="animate-[spin_20s_linear_infinite]"/>
        <path d="M10 16h12M16 10v12" stroke="#ff7a2f" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="16" cy="16" r="3" fill="#ff7a2f"/>
      </svg>
    ),
    stat: 'Ed25519',
    statLabel: 'Signatures',
    title: 'Cryptographic Monetization',
    body: 'Package and sell your modules. Q-OS enforces Ed25519 cryptographic licensing natively on the edge. License validation works 100% offline — no API keys or Stripe dependencies.',
    color: '#ff7a2f',
  },
];

// ─── Terminal Animation ───────────────────────────────────────────────────────
function TerminalAnimation() {
  const [leftLines, setLeftLines] = useState<string[]>([]);
  const [rightLines, setRightLines] = useState<string[]>([]);

  useEffect(() => {
    const buildSequence = [
      { text: "$ qos build --release", delay: 500 },
      { text: "   Compiling qos-module v0.1.0 (/app)", delay: 1200 },
      { text: "   Compiling serde v1.0.197", delay: 1500 },
      { text: "   Compiling wasm-bindgen v0.2.92", delay: 1800 },
      { text: "    Finished release [optimized] target(s) in 2.34s", delay: 2800 },
      { text: "$ qos deploy target/wasm32-unknown-unknown/release/module.qos", delay: 3500 },
      { text: "🚀 Deploying payload (42 KB)...", delay: 4000 },
      { text: "✅ Broadcasted to DHT network.", delay: 4500 }
    ];

    const meshSequence = [
      { text: "[MESH] Starting libp2p listener on 0.0.0.0:4001", delay: 1000 },
      { text: "[DHT] Connected to bootstrap node 12D3KooW...", delay: 2000 },
      { text: "[PUBSUB] Subscribed to topic 'qos.modules'", delay: 2500 },
      { text: "[SYNC] Received new CRDT state vector", delay: 3000 },
      { text: "[MESH] 📥 Incoming module detected: module.qos", delay: 4600 },
      { text: "[WASM] Validating Ed25519 signature...", delay: 4800 },
      { text: "[WASM] Signature verified. Instantiating memory.", delay: 5200 },
      { text: "[EXEC] Module 'module.qos' active. Latency: 0.8ms", delay: 5500 }
    ];

    const timeouts: NodeJS.Timeout[] = [];

    buildSequence.forEach(({ text, delay }) => {
      timeouts.push(setTimeout(() => setLeftLines(prev => [...prev, text]), delay));
    });

    meshSequence.forEach(({ text, delay }) => {
      timeouts.push(setTimeout(() => setRightLines(prev => [...prev, text]), delay));
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start w-full">
      {/* Left Pane - Builder */}
      <div className="rounded-xl bg-[#050505] border border-[#00ff41]/20 shadow-[0_0_40px_rgba(0,255,65,0.1)] overflow-hidden">
        <div className="bg-[#111] px-4 py-2 border-b border-[#00ff41]/10 flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff003c]/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#facc15]/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#00ff41]/80" />
          </div>
          <span className="font-mono-code text-[10px] text-gray-500 ml-2">builder@dev:~</span>
        </div>
        <div className="p-5 font-mono-code text-[12px] text-gray-300 min-h-[240px] flex flex-col gap-1.5 text-left">
          {leftLines.map((line, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={line.startsWith('$') ? 'text-[#00ff41] font-bold mt-2' : line.startsWith('✅') || line.startsWith('🚀') ? 'text-white' : 'text-gray-400'}>
              {line}
            </motion.div>
          ))}
          <div className="mt-1 flex items-center">
            <span className="w-2 h-4 bg-[#00ff41] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Right Pane - Mesh Node */}
      <div className="rounded-xl bg-[#050505] border border-[#00d4ff]/20 shadow-[0_0_40px_rgba(0,212,255,0.1)] overflow-hidden">
        <div className="bg-[#111] px-4 py-2 border-b border-[#00d4ff]/10 flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff003c]/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#facc15]/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#00ff41]/80" />
          </div>
          <span className="font-mono-code text-[10px] text-[#00d4ff]/60 ml-2">mesh_node_eu_west_1</span>
        </div>
        <div className="p-5 font-mono-code text-[12px] text-gray-300 min-h-[240px] flex flex-col gap-1.5 text-left">
          {rightLines.map((line, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={line.includes('[WASM]') || line.includes('[EXEC]') ? 'text-[#00d4ff]' : 'text-gray-400'}>
              {line}
            </motion.div>
          ))}
          <div className="mt-1 flex items-center">
            <span className="w-2 h-4 bg-[#00d4ff] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20">
        <div className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: 'radial-gradient(rgba(0,212,255,0.5) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, #0a0a0a 100%)' }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-[#00ff41]/4 blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center gap-7">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 border border-[#00ff41]/30 bg-[#00ff41]/5 rounded-full px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse" />
            <span className="font-mono-code text-[#00ff41] text-[11px] tracking-widest uppercase">Developer Preview Live</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7 }}
            className="text-5xl md:text-7xl xl:text-[88px] font-black tracking-tight leading-[0.95] font-mono-code">
            <span className="text-white">The Serverless</span><br />
            <span className="text-gradient-green">Edge Protocol.</span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl md:text-2xl text-gray-400 max-w-3xl leading-relaxed font-light">
            Deploy WebAssembly modules directly to the physical floor. <span className="text-white font-medium">Zero cloud costs, sub-millisecond execution, and unbreakable P2P mesh synchronization.</span>
          </motion.p>

          {/* Typing effect */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65, duration: 0.5 }}
            className="h-8 flex items-center text-lg">
            <TypingEffect />
          </motion.div>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center gap-4 mt-2">
            <Link href="/developers"
              className="px-8 py-4 text-sm font-bold font-mono-code text-black bg-[#00ff41] rounded-xl tracking-widest uppercase shadow-[0_0_35px_rgba(0,255,65,0.4)] hover:shadow-[0_0_55px_rgba(0,255,65,0.6)] hover:scale-105 active:scale-100 transition-all duration-200">
              Read the Docs
            </Link>
            <Link href="https://github.com/qos/qos" target="_blank"
              className="px-8 py-4 text-sm font-bold font-mono-code text-[#00d4ff] border border-[#00d4ff]/35 rounded-xl tracking-widest uppercase hover:border-[#00d4ff]/70 hover:bg-[#00d4ff]/5 hover:shadow-[0_0_20px_rgba(0,212,255,0.12)] transition-all duration-200">
              View Source →
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.7 }}
            className="mt-16 w-full max-w-3xl grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-[#00d4ff]/10 pt-10">
            {[
              { v: '< 2ms', l: 'Cold Start', c: '#00d4ff' },
              { v: '$0', l: 'Cloud Cost', c: '#00ff41' },
              { v: '100%', l: 'P2P Uptime', c: '#00ff41' },
              { v: 'WASM', l: 'Execution', c: '#00d4ff' },
            ].map(s => (
              <div key={s.l} className="flex flex-col items-center gap-1">
                <span className="font-mono-code text-2xl md:text-3xl font-black" style={{ color: s.c }}>{s.v}</span>
                <span className="text-gray-600 font-mono-code text-[10px] uppercase tracking-widest text-center">{s.l}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── MARQUEE ───────────────────────────────────────────────────────────── */}
      <section className="py-10 border-y border-[#00d4ff]/8 overflow-hidden select-none">
        <p className="text-center font-mono-code text-[10px] tracking-widest text-gray-700 uppercase mb-6">
          Legacy Cloud Dependencies Eliminated
        </p>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
          <div className="flex gap-12 whitespace-nowrap" style={{ animation: 'marquee 28s linear infinite' }}>
            {[...LOGOS, ...LOGOS].map((l, i) => (
              <div key={i} className="flex flex-col items-center gap-1 opacity-30 hover:opacity-60 transition-opacity">
                <span className="font-mono-code text-white font-bold text-lg tracking-widest">{l.name}</span>
                <span className="font-mono-code text-[#ff003c] text-[9px] tracking-widest uppercase">{l.sub}</span>
              </div>
            ))}
          </div>
        </div>
        <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
      </section>

      {/* ── DEVELOPER TERMINAL (Replaces Use Cases) ─────────────────────────── */}
      <section className="py-32 px-6 relative">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(rgba(0,212,255,0.3) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16">
            <p className="font-mono-code text-[#00d4ff] text-[11px] tracking-widest uppercase mb-4">&gt;_ Real-Time Execution</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Compile locally.<br /><span className="text-gradient-blue">Synchronize globally.</span>
            </h2>
          </motion.div>

          <TerminalAnimation />
        </div>
      </section>

      {/* ── VALUE PROPS (Dev Pitch) ────────────────────────────────────────── */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-20">
            <p className="font-mono-code text-[#00d4ff] text-[11px] tracking-widest uppercase mb-4">&gt;_ Core Architecture</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Engineered for the <span className="text-gradient-green">physical layer.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {VALUE_PROPS.map((vp, i) => (
              <motion.div key={vp.title}
                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.12, duration: 0.6 }}
                whileHover={{ y: -6 }}
                className="relative p-8 rounded-2xl bg-[#111111] border border-[#00d4ff]/12 hover:border-[#00d4ff]/28 transition-all duration-300 group overflow-hidden flex flex-col gap-5">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 50% 0%, ${vp.color}0d, transparent 70%)` }} />
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-xl border" style={{ borderColor: vp.color + '30', background: vp.color + '0d' }}>
                    {vp.icon}
                  </div>
                  <div className="text-right">
                    <div className="font-mono-code text-3xl font-black" style={{ color: vp.color }}>{vp.stat}</div>
                    <div className="font-mono-code text-[10px] text-gray-600 uppercase tracking-widest">{vp.statLabel}</div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-3">{vp.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{vp.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA BANNER ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: '-80px' }}
          className="max-w-4xl mx-auto text-center rounded-3xl border border-[#00ff41]/20 bg-gradient-to-br from-[#00ff41]/6 via-[#0a0a0a] to-[#00d4ff]/6 p-16 relative overflow-hidden">
          <div className="absolute inset-0 scanlines opacity-25 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-[#00ff41]/60 to-transparent" />
          <p className="font-mono-code text-[#00ff41] text-[11px] tracking-widest uppercase mb-5">Ready to go live?</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
            The decentralized future is<br /> <span className="text-gradient-green">serverless.</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Download the Q-OS Daemon, deploy your first WASM module, and experience zero-latency computing.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/developers"
              className="px-10 py-4 text-sm font-bold font-mono-code text-black bg-[#00ff41] rounded-xl tracking-widest uppercase shadow-[0_0_35px_rgba(0,255,65,0.4)] hover:shadow-[0_0_55px_rgba(0,255,65,0.6)] hover:scale-105 transition-all">
              Initialize Node →
            </Link>
            <Link href="https://github.com/qos/qos" target="_blank"
              className="font-mono-code text-sm text-gray-500 hover:text-[#00d4ff] tracking-widest transition-colors">
              GitHub Repository
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
