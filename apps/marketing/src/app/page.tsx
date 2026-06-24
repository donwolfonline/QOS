'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

// ─── Typing Effect ───────────────────────────────────────────────────────────
const PHRASES = [
  'Zero-Latency Edge Execution.',
  'Serverless Physical Infrastructure.',
  'Real-time CRDT Synchronization.',
  'WASM Payloads. Physical Space.',
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
        <circle cx="16" cy="16" r="14" stroke="#00ff41" strokeWidth="1.5" strokeDasharray="4 2" className="animate-[spin_20s_linear_infinite]"/>
        <path d="M10 16h12M16 10v12" stroke="#00ff41" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="16" cy="16" r="3" fill="#00ff41"/>
      </svg>
    ),
    stat: '$0',
    statLabel: 'Cloud Spend',
    title: 'Drop AWS Bills to $0',
    body: 'Q-OS runs entirely on hardware you already own. No EC2 instances, no Lambda invocations, no egress fees. Your edge node is your server — local, sovereign, free.',
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
    stat: '100%',
    statLabel: 'Uptime Offline',
    title: 'Unbreakable Local Mesh',
    body: 'CRDT-powered state syncs instantly across all peers on your LAN. Broadband goes down — your venue keeps running. Guests check in, staff get updates, business continues.',
    color: '#00d4ff',
  },
  {
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="16" rx="2" stroke="#ff7a2f" strokeWidth="1.5"/>
        <path d="M10 16c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6" stroke="#ff7a2f" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="16" cy="16" r="2" fill="#ff7a2f"/>
      </svg>
    ),
    stat: '< 2ms',
    statLabel: 'Execution Time',
    title: 'Write Rust, Deploy to the Floor',
    body: 'Compile any logic to WASM and hot-deploy it to physical QR codes without reprinting. Menu change? Price update? VIP flow? Push it live in seconds from the Admin HUD.',
    color: '#ff7a2f',
  },
];

// ─── Use Case Tabs ────────────────────────────────────────────────────────────
const USE_CASES = [
  {
    id: 'restaurants',
    label: 'Restaurants',
    icon: '🍽️',
    headline: 'From QR to Checkout in 8 Seconds',
    sub: 'Replace paper menus, POS tablets, and waitlist apps with a single WASM module. Guests scan, order, and pay — all within their native browser, zero app install.',
    metrics: [
      { label: 'Table Turn Speed', before: '42 min', after: '28 min', color: '#00ff41' },
      { label: 'Staff Interruptions / Hr', before: '34', after: '8', color: '#00ff41' },
      { label: 'POS System Cost / Mo', before: '$320', after: '$0', color: '#00ff41' },
    ],
    terminal: [
      { type: 'cmd', text: '$ qos module deploy ./happy_hour_menu.wasm --table all' },
      { type: 'ok',  text: '[OK] Module deployed to 12 tables simultaneously.' },
      { type: 'ok',  text: '[MESH] 3 guests already interacting with new flow.' },
    ],
    color: '#00ff41',
  },
  {
    id: 'retail',
    label: 'Retail',
    icon: '🛍️',
    headline: 'Real-Time Inventory. Zero Cloud.',
    sub: 'Every shelf becomes a sensor endpoint. Q-OS syncs stock levels, pricing, and promotions across the floor in milliseconds — without a single cloud API call.',
    metrics: [
      { label: 'Inventory Sync Latency', before: '8 min', after: '< 50ms', color: '#00d4ff' },
      { label: 'Out-of-Stock Events / Day', before: '18', after: '3', color: '#00d4ff' },
      { label: 'Cloud API Spend / Mo', before: '$890', after: '$0', color: '#00d4ff' },
    ],
    terminal: [
      { type: 'cmd', text: '$ qos module deploy ./inventory_sync.wasm --zone shelf-a' },
      { type: 'ok',  text: '[STATE] 847 SKUs indexed to local Sled store.' },
      { type: 'ok',  text: '[MESH] Realtime price broadcast active.' },
    ],
    color: '#00d4ff',
  },
  {
    id: 'events',
    label: 'Events',
    icon: '🎟️',
    headline: 'VIP Check-In at Light Speed',
    sub: 'No app downloads, no cell signal dependencies. Guests scan a QR, WASM validates their token locally, and the admin\'s floor plan lights up green — all in under 2ms.',
    metrics: [
      { label: 'Check-In Speed', before: '45 sec', after: '< 2 sec', color: '#facc15' },
      { label: 'Queue Length (avg)', before: '28 guests', after: '2 guests', color: '#facc15' },
      { label: 'Infrastructure Cost', before: '$1,200', after: '$0', color: '#facc15' },
    ],
    terminal: [
      { type: 'cmd', text: '$ qos module deploy ./vip_checkin.wasm --event gala_2026' },
      { type: 'ok',  text: '[WASM] 2,400 tokens loaded into local state.' },
      { type: 'ok',  text: '[MESH] Live floor plan ready. 0ms cloud round-trip.' },
    ],
    color: '#facc15',
  },
];

// ─── Dashboard Mockup ─────────────────────────────────────────────────────────
function DashboardMockup({ useCase }: { useCase: typeof USE_CASES[0] }) {
  const tables = [1, 2, 3, 4, 5, 6, 7, 8];
  const occupied = [1, 3, 5, 7];
  return (
    <motion.div
      key={useCase.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl bg-[#050505] border overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)]"
      style={{ borderColor: useCase.color + '30' }}
    >
      {/* Window chrome */}
      <div className="bg-[#111] px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: useCase.color + '20' }}>
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ff003c]/80" />
          <span className="w-3 h-3 rounded-full bg-[#facc15]/80" />
          <span className="w-3 h-3 rounded-full bg-[#00ff41]/80" />
        </div>
        <span className="flex-1 text-center font-mono-code text-[10px] tracking-widest uppercase" style={{ color: useCase.color + '60' }}>
          Q-OS Admin // {useCase.label} Mode
        </span>
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: useCase.color }} />
      </div>

      <div className="p-5 grid grid-cols-5 gap-4 min-h-[340px]">
        {/* Floor Grid */}
        <div className="col-span-3 flex flex-col gap-3">
          <p className="font-mono-code text-[10px] tracking-widest uppercase opacity-50" style={{ color: useCase.color }}>
            &gt;_ Live Floor Plan
          </p>
          <div className="grid grid-cols-4 gap-2 flex-1">
            {tables.map(t => {
              const isOcc = occupied.includes(t);
              return (
                <motion.div
                  key={t}
                  animate={{ borderColor: isOcc ? useCase.color : 'rgba(255,255,255,0.08)', backgroundColor: isOcc ? useCase.color + '10' : '#0a0a0a', boxShadow: isOcc ? `0 0 12px ${useCase.color}30` : 'none' }}
                  transition={{ duration: 0.5 }}
                  className="rounded-lg border-2 p-2 flex flex-col items-center justify-center aspect-square"
                >
                  <span className="font-mono-code text-[10px] font-bold" style={{ color: isOcc ? useCase.color : 'rgba(255,255,255,0.2)' }}>
                    {String(t).padStart(2,'0')}
                  </span>
                  {isOcc && <span className="w-1.5 h-1.5 rounded-full mt-1 animate-pulse" style={{ background: useCase.color }} />}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Terminal Feed */}
        <div className="col-span-2 flex flex-col gap-2">
          <p className="font-mono-code text-[10px] tracking-widest uppercase opacity-50" style={{ color: useCase.color }}>&gt;_ Feed</p>
          <div className="flex-1 bg-[#0a0a0a] rounded-lg p-3 border flex flex-col gap-2" style={{ borderColor: useCase.color + '15' }}>
            {useCase.terminal.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.25 }}
                className="font-mono-code text-[10px] leading-relaxed"
              >
                {line.type === 'cmd'
                  ? <><span className="text-[#00d4ff] mr-1">$</span><span className="text-white">{line.text.slice(2)}</span></>
                  : <><span className="opacity-40 mr-1">&gt;</span><span style={{ color: useCase.color }}>{line.text}</span></>
                }
              </motion.div>
            ))}
            <div className="flex items-center gap-1 mt-auto">
              <span className="text-[#00d4ff] font-mono-code text-[10px]">$</span>
              <span className="w-1.5 h-3 animate-pulse" style={{ background: useCase.color }} />
            </div>
          </div>

          {/* Metrics mini-cards */}
          <div className="flex flex-col gap-1.5">
            {useCase.metrics.slice(0, 2).map(m => (
              <div key={m.label} className="flex items-center justify-between bg-[#0a0a0a] rounded-lg px-3 py-2 border" style={{ borderColor: useCase.color + '15' }}>
                <span className="font-mono-code text-[9px] text-gray-600 truncate">{m.label}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono-code text-[9px] text-gray-600 line-through">{m.before}</span>
                  <span className="font-mono-code text-[10px] font-bold" style={{ color: m.color }}>{m.after}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20">
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: 'radial-gradient(rgba(0,212,255,0.5) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
        {/* Radial darken at edges */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, #0a0a0a 100%)' }} />
        {/* Green ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-[#00ff41]/4 blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center gap-7">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 border border-[#00ff41]/30 bg-[#00ff41]/5 rounded-full px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse" />
            <span className="font-mono-code text-[#00ff41] text-[11px] tracking-widest uppercase">Public Alpha — Free to Deploy</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7 }}
            className="text-5xl md:text-7xl xl:text-[88px] font-black tracking-tight leading-[0.95] font-mono-code">
            <span className="text-white">The End of</span><br />
            <span className="text-gradient-green">Cloud Latency.</span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl md:text-2xl text-gray-400 max-w-2xl leading-relaxed font-light">
            Turn your physical locations into{' '}
            <span className="text-white font-medium">serverless compute nodes.</span>
            {' '}Zero cloud costs, absolute real-time synchronization.
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
              Start Building — Free
            </Link>
            <Link href="/features"
              className="px-8 py-4 text-sm font-bold font-mono-code text-[#00d4ff] border border-[#00d4ff]/35 rounded-xl tracking-widest uppercase hover:border-[#00d4ff]/70 hover:bg-[#00d4ff]/5 hover:shadow-[0_0_20px_rgba(0,212,255,0.12)] transition-all duration-200">
              See All Features →
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.7 }}
            className="mt-16 w-full max-w-3xl grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-[#00d4ff]/10 pt-10">
            {[
              { v: '< 2ms', l: 'Cold Start', c: '#00d4ff' },
              { v: '$0', l: 'Cloud Cost', c: '#00ff41' },
              { v: '100%', l: 'Works Offline', c: '#00ff41' },
              { v: 'WASM', l: 'Sandbox', c: '#00d4ff' },
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
          Cloud services your team no longer needs
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

      {/* ── VALUE PROPS (CTO Pitch) ────────────────────────────────────────── */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-20">
            <p className="font-mono-code text-[#00d4ff] text-[11px] tracking-widest uppercase mb-4">&gt;_ The CTO Pitch</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Why your engineers will <span className="text-gradient-green">love this.</span>
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
                {/* Stat */}
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

      {/* ── USE CASES (Tabbed) ────────────────────────────────────────────────── */}
      <section className="py-32 px-6 relative">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(rgba(0,212,255,0.3) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16">
            <p className="font-mono-code text-[#00d4ff] text-[11px] tracking-widest uppercase mb-4">&gt;_ Use Cases</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              One protocol.<br /><span className="text-gradient-blue">Every physical space.</span>
            </h2>
          </motion.div>

          {/* Tab pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {USE_CASES.map((uc, i) => (
              <button key={uc.id} onClick={() => setActiveTab(i)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono-code text-sm tracking-wide transition-all duration-300 border ${
                  activeTab === i
                    ? 'text-black font-bold scale-105'
                    : 'bg-transparent text-gray-500 hover:text-gray-300 border-[#00d4ff]/15 hover:border-[#00d4ff]/35'
                }`}
                style={activeTab === i ? { background: uc.color, borderColor: uc.color, boxShadow: `0 0 20px ${uc.color}40` } : {}}>
                <span>{uc.icon}</span>
                {uc.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="grid lg:grid-cols-2 gap-10 items-start">

              {/* Left: Text + Metrics */}
              <div className="flex flex-col gap-8">
                <div>
                  <h3 className="text-3xl font-black text-white mb-3">{USE_CASES[activeTab].headline}</h3>
                  <p className="text-gray-400 leading-relaxed">{USE_CASES[activeTab].sub}</p>
                </div>

                <div className="flex flex-col gap-3">
                  <p className="font-mono-code text-[10px] uppercase tracking-widest text-gray-600">Before / After Metrics</p>
                  {USE_CASES[activeTab].metrics.map(m => (
                    <div key={m.label} className="flex items-center justify-between p-4 rounded-xl bg-[#111] border border-[#00d4ff]/10 hover:border-[#00d4ff]/25 transition-colors">
                      <span className="text-gray-400 text-sm">{m.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono-code text-gray-600 text-sm line-through">{m.before}</span>
                        <span className="font-bold font-mono-code text-sm" style={{ color: m.color }}>{m.after}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Link href="/features"
                  className="inline-flex items-center gap-2 font-mono-code text-sm tracking-widest self-start transition-colors"
                  style={{ color: USE_CASES[activeTab].color }}>
                  See all {USE_CASES[activeTab].label} features →
                </Link>
              </div>

              {/* Right: Dashboard Mockup */}
              <DashboardMockup useCase={USE_CASES[activeTab]} />
            </motion.div>
          </AnimatePresence>
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
            Your venue is waiting<br />to be <span className="text-gradient-green">activated.</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            One command. One QR code. Infinite programmability.<br />Get live in under 5 minutes — no credit card.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/developers"
              className="px-10 py-4 text-sm font-bold font-mono-code text-black bg-[#00ff41] rounded-xl tracking-widest uppercase shadow-[0_0_35px_rgba(0,255,65,0.4)] hover:shadow-[0_0_55px_rgba(0,255,65,0.6)] hover:scale-105 transition-all">
              Deploy Free Node →
            </Link>
            <Link href="/pricing"
              className="font-mono-code text-sm text-gray-500 hover:text-[#00d4ff] tracking-widest transition-colors">
              View Pricing
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
