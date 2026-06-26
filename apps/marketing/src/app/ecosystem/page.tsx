'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';

// ─── License tiers ────────────────────────────────────────────────────────────
const LICENSE_TIERS = [
  { label: 'Starter', pricePerNode: 4, color: '#00d4ff', desc: 'Indie devs & hobbyist modules' },
  { label: 'Pro', pricePerNode: 12, color: '#00ff41', desc: 'Production-grade business tooling' },
  { label: 'Enterprise', pricePerNode: 29, color: '#c792ea', desc: 'Mission-critical edge deployments' },
];

// ─── Lifecycle Steps ──────────────────────────────────────────────────────────
const LIFECYCLE = [
  {
    step: '01',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="5" width="22" height="18" rx="2" stroke="#00d4ff" strokeWidth="1.5"/>
        <path d="M9 10l4 4-4 4M15 18h4" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Developer Codes Module',
    desc: 'Write logic in Rust, Go, or AssemblyScript. Compile to a portable .qos WASM bundle targeting the Q-OS ABI.',
    color: '#00d4ff',
    detail: '$ qos build --release ./my_module',
  },
  {
    step: '02',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 28 28" fill="none">
        <path d="M14 4l2.5 5.5 6 .5-4.5 4 1.5 6L14 17l-5.5 3 1.5-6L5.5 10l6-.5L14 4z" stroke="#facc15" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Signs with Ed25519 Key',
    desc: 'The module is cryptographically signed with your Master Private Key. The public key is embedded in the package manifest.',
    color: '#facc15',
    detail: '$ qos sign ./my_module.qos --key ~/.qos/master.key',
  },
  {
    step: '03',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="10" stroke="#00ff41" strokeWidth="1.5" strokeDasharray="4 2"/>
        <path d="M14 8v6l4 2" stroke="#00ff41" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="14" cy="14" r="2" fill="#00ff41"/>
      </svg>
    ),
    title: 'Publishes to Q-OS Registry',
    desc: 'Push your signed bundle to the decentralized module registry. It becomes globally discoverable via the DHT network.',
    color: '#00ff41',
    detail: '$ qos publish ./my_module.qos --registry mainnet',
  },
  {
    step: '04',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="8" width="14" height="12" rx="1.5" stroke="#ff7a2f" strokeWidth="1.5"/>
        <path d="M18 11h2a2 2 0 010 4h-2" stroke="#ff7a2f" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M7 13h8" stroke="#ff7a2f" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Businesses Buy Licenses',
    desc: 'Companies checkout through the Q-OS Registry. A cryptographic license payload is generated and tied to their Edge Node ID.',
    color: '#ff7a2f',
    detail: 'License: {"node_id":"…","module_hash":"…","expires":"perpetual"}',
  },
  {
    step: '05',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 28 28" fill="none">
        <path d="M14 4v20M7 8l7-4 7 4M7 20l7 4 7-4" stroke="#c792ea" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M4 12l10 6 10-6" stroke="#c792ea" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Developer Earns Revenue',
    desc: 'Revenue is automatically settled. Each valid license checkout triggers a payout to the developer\'s registered wallet or Stripe account.',
    color: '#c792ea',
    detail: 'Payout: $12.00 / node / month — 85% developer share',
  },
];

// ─── DRM Security Points ──────────────────────────────────────────────────────
const DRM_POINTS = [
  {
    icon: '🔐',
    title: 'Offline Signature Verification',
    body: 'The qos-runtime validates Ed25519 signatures locally on every module load. No network call required — verification is cryptographically guaranteed even with zero internet.',
    color: '#00ff41',
    code: `// qos-runtime enforcement (simplified)
let sig = module.manifest.signature;
let pubkey = module.manifest.public_key;
let payload = module.manifest.hash;
crypto::ed25519::verify(&sig, &payload, &pubkey)?;`,
  },
  {
    icon: '🪪',
    title: 'Node-Locked Licenses',
    body: 'Each license payload is cryptographically bound to a specific Edge Node ID. Copying a license to an unlicensed node triggers an immediate runtime rejection — no grace period.',
    color: '#00d4ff',
    code: `// License binding check
let node_id = runtime::get_node_id();
let license = license_store::load(&module.hash)?;
assert_eq!(license.node_id, node_id, "License bound to different node");`,
  },
  {
    icon: '⏱️',
    title: 'Temporal Expiry Enforcement',
    body: 'The runtime compares the license expiry timestamp against a tamper-proof monotonic clock. Expired licenses are quarantined — the module enters an inert state and cannot execute.',
    color: '#facc15',
    code: `// Expiry check
if let Some(expiry) = license.expires_at {
    let now = SystemTime::now();
    ensure!(now < expiry, LicenseError::Expired);
}`,
  },
  {
    icon: '🚫',
    title: 'Tamper-Proof WASM Hashing',
    body: 'Every .qos module bundle is SHA-256 hashed at publish time. On load, the runtime re-hashes the binary and compares it against the signed manifest. Any modification invalidates the signature.',
    color: '#ff7a2f',
    code: `// Hash integrity check
let actual = sha256::hash(&module.wasm_bytes);
ensure!(actual == module.manifest.hash,
    LicenseError::HashMismatch);`,
  },
];

// ─── Earnings Calculator ──────────────────────────────────────────────────────
function EarningsCalculator() {
  const [nodes, setNodes] = useState(50);
  const [tierIdx, setTierIdx] = useState(1);
  const tier = LICENSE_TIERS[tierIdx];
  const gross = nodes * tier.pricePerNode;
  const dev = Math.floor(gross * 0.85);
  const platform = gross - dev;

  return (
    <div className="rounded-2xl bg-[#0d0d0d] border border-[#00ff41]/20 overflow-hidden">
      {/* Header */}
      <div className="px-8 py-5 border-b border-[#00ff41]/10 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-[#00ff41] animate-pulse" />
        <span className="font-mono-code text-[11px] tracking-widest text-[#00ff41]/60 uppercase">Revenue Simulator — Live Preview</span>
      </div>

      <div className="p-8 flex flex-col gap-8">
        {/* Tier Selector */}
        <div>
          <p className="font-mono-code text-[10px] uppercase tracking-widest text-gray-600 mb-3">License Tier</p>
          <div className="grid grid-cols-3 gap-3">
            {LICENSE_TIERS.map((t, i) => (
              <button key={t.label} onClick={() => setTierIdx(i)}
                className={`rounded-xl p-4 border text-left transition-all duration-200 ${i === tierIdx ? 'scale-[1.02]' : 'opacity-50 hover:opacity-80'}`}
                style={{ borderColor: i === tierIdx ? t.color + '60' : '#ffffff10', background: i === tierIdx ? t.color + '0d' : 'transparent', boxShadow: i === tierIdx ? `0 0 20px ${t.color}20` : 'none' }}>
                <p className="font-mono-code font-bold text-sm" style={{ color: t.color }}>{t.label}</p>
                <p className="font-mono-code text-2xl font-black text-white mt-1">${t.pricePerNode}<span className="text-xs text-gray-500 font-normal">/node/mo</span></p>
                <p className="text-gray-500 text-[11px] mt-1">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Node Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono-code text-[10px] uppercase tracking-widest text-gray-600">Active Edge Nodes</p>
            <motion.span key={nodes} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="font-mono-code font-black text-2xl" style={{ color: tier.color }}>
              {nodes.toLocaleString()}
            </motion.span>
          </div>
          <input type="range" min={1} max={500} value={nodes} onChange={e => setNodes(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, ${tier.color} ${(nodes / 500) * 100}%, #1a1a1a ${(nodes / 500) * 100}%)`, accentColor: tier.color }} />
          <div className="flex justify-between mt-1">
            <span className="font-mono-code text-[9px] text-gray-700">1</span>
            <span className="font-mono-code text-[9px] text-gray-700">500</span>
          </div>
        </div>

        {/* Output Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Gross Revenue', value: `$${gross.toLocaleString()}`, sub: 'per month', color: tier.color },
            { label: 'Your Share (85%)', value: `$${dev.toLocaleString()}`, sub: 'per month', color: '#00ff41' },
            { label: 'Annual Earnings', value: `$${(dev * 12).toLocaleString()}`, sub: 'per year', color: '#c792ea' },
          ].map(c => (
            <div key={c.label} className="rounded-xl bg-[#111] border border-white/5 p-5 flex flex-col gap-2">
              <p className="font-mono-code text-[10px] uppercase tracking-widest text-gray-600">{c.label}</p>
              <motion.p key={c.value} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="font-mono-code text-2xl font-black" style={{ color: c.color }}>{c.value}</motion.p>
              <p className="font-mono-code text-[10px] text-gray-700">{c.sub}</p>
            </div>
          ))}
        </div>

        <p className="text-gray-700 text-[11px] font-mono-code text-center">
          Projections assume full license utilization. Q-OS takes a 15% platform fee. Payouts via Stripe Connect or crypto wallet.
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EcosystemPage() {
  const [activeDrm, setActiveDrm] = useState(0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden">

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-24 px-6 text-center">
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(rgba(199,146,234,0.6) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 30%, transparent 20%, #0a0a0a 100%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-[#c792ea]/5 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-6">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 border border-[#c792ea]/30 bg-[#c792ea]/5 rounded-full px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c792ea] animate-pulse" />
            <span className="font-mono-code text-[#c792ea] text-[11px] tracking-widest uppercase">Ecosystem & Monetization</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7 }}
            className="text-5xl md:text-7xl font-black tracking-tight leading-[0.95] font-mono-code">
            <span className="text-white">Build Once.</span><br />
            <span style={{ color: '#c792ea' }}>Earn Forever.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl text-gray-400 max-w-2xl leading-relaxed">
            Q-OS is an <span className="text-white font-medium">open marketplace for edge computing modules.</span>{' '}
            Publish your WASM logic, set your price, and earn recurring revenue from every node that runs your code.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }}
            className="flex items-center gap-4">
            <Link href="/developers"
              className="px-7 py-3.5 text-sm font-bold font-mono-code text-[#0a0a0a] rounded-xl tracking-widest uppercase transition-all duration-200 hover:scale-105 hover:shadow-[0_0_40px_rgba(199,146,234,0.5)]"
              style={{ background: '#c792ea', boxShadow: '0 0 25px rgba(199,146,234,0.3)' }}>
              Publish Your Module
            </Link>
            <Link href="#calculator"
              className="px-7 py-3.5 text-sm font-bold font-mono-code text-[#c792ea] border border-[#c792ea]/35 rounded-xl tracking-widest uppercase hover:border-[#c792ea]/70 hover:bg-[#c792ea]/5 transition-all duration-200">
              Calculate Earnings →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── LIFECYCLE FLOWCHART ─────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-20">
            <p className="font-mono-code text-[#c792ea] text-[11px] tracking-widest uppercase mb-4">&gt;_ Module Lifecycle</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">From idea to income,<br /><span style={{ color: '#c792ea' }}>in 5 steps.</span></h2>
          </motion.div>

          {/* Desktop flowchart */}
          <div className="hidden lg:flex items-start gap-0 relative">
            {/* Connecting line */}
            <div className="absolute top-10 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {LIFECYCLE.map((step, i) => (
              <motion.div key={step.step}
                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.12, duration: 0.6 }}
                className="flex-1 flex flex-col items-center text-center gap-4 px-3 group cursor-default">

                {/* Icon node */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl border flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ borderColor: step.color + '40', background: step.color + '0f', boxShadow: `0 0 24px ${step.color}20` }}>
                    {step.icon}
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full border flex items-center justify-center font-mono-code text-[9px] font-bold"
                      style={{ background: '#0a0a0a', borderColor: step.color + '60', color: step.color }}>
                      {step.step}
                    </span>
                  </div>
                  {/* Arrow connector */}
                  {i < LIFECYCLE.length - 1 && (
                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 font-mono-code text-gray-700 text-lg pointer-events-none select-none z-10">›</div>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-[12px] leading-relaxed mb-3">{step.desc}</p>
                  <div className="rounded-lg bg-[#111] border px-2 py-1.5" style={{ borderColor: step.color + '20' }}>
                    <code className="font-mono-code text-[9px] break-all leading-relaxed" style={{ color: step.color + 'cc' }}>
                      {step.detail}
                    </code>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile flowchart */}
          <div className="flex lg:hidden flex-col gap-0">
            {LIFECYCLE.map((step, i) => (
              <motion.div key={step.step}
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex gap-5 items-start">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-14 h-14 rounded-xl border flex items-center justify-center"
                    style={{ borderColor: step.color + '40', background: step.color + '0f' }}>
                    {step.icon}
                  </div>
                  {i < LIFECYCLE.length - 1 && <div className="w-px h-8 mt-1" style={{ background: step.color + '30' }} />}
                </div>
                <div className="pt-2 pb-6">
                  <p className="font-mono-code text-[10px] mb-1" style={{ color: step.color }}>{step.step}</p>
                  <h3 className="font-bold text-white text-sm mb-1.5">{step.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EARNINGS CALCULATOR ──────────────────────────────────────────────── */}
      <section id="calculator" className="py-28 px-6 relative">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(rgba(0,255,65,0.8) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-12">
            <p className="font-mono-code text-[#00ff41] text-[11px] tracking-widest uppercase mb-4">&gt;_ Revenue Projections</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Calculate your <span className="text-gradient-green">earnings.</span></h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">Drag the slider to see your projected monthly income based on active node count and license tier.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}>
            <EarningsCalculator />
          </motion.div>
        </div>
      </section>

      {/* ── DRM SECURITY ────────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-16">
            <p className="font-mono-code text-[#ff003c] text-[11px] tracking-widest uppercase mb-4">&gt;_ Anti-Piracy Architecture</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Cryptographic DRM.<br /><span className="text-[#ff003c]">Unbreakable at the edge.</span>
            </h2>
            <p className="text-gray-500 mt-5 max-w-2xl mx-auto leading-relaxed">
              The qos-runtime strictly enforces software licensing at the binary level. Every module execution path is gated behind multiple layers of cryptographic verification that operate fully offline.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Tab nav */}
            <div className="flex flex-col gap-3">
              {DRM_POINTS.map((p, i) => (
                <motion.button key={p.title}
                  initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => setActiveDrm(i)}
                  className={`text-left rounded-2xl p-5 border transition-all duration-300 ${activeDrm === i ? 'scale-[1.02]' : 'hover:border-white/10 opacity-60 hover:opacity-90'}`}
                  style={activeDrm === i ? { borderColor: p.color + '40', background: p.color + '0a', boxShadow: `0 0 30px ${p.color}15` } : { borderColor: '#ffffff0a', background: '#0d0d0d' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{p.icon}</span>
                    <h3 className="font-bold text-white">{p.title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">{p.body}</p>
                </motion.button>
              ))}
            </div>

            {/* Code panel */}
            <div className="sticky top-24 self-start">
              <motion.div key={activeDrm}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden border"
                style={{ borderColor: DRM_POINTS[activeDrm].color + '30' }}>
                {/* Window chrome */}
                <div className="bg-[#111] px-5 py-3 border-b flex items-center gap-3"
                  style={{ borderColor: DRM_POINTS[activeDrm].color + '20' }}>
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#ff003c]/70" />
                    <span className="w-3 h-3 rounded-full bg-[#facc15]/70" />
                    <span className="w-3 h-3 rounded-full bg-[#00ff41]/70" />
                  </div>
                  <span className="font-mono-code text-[10px] tracking-widest ml-2" style={{ color: DRM_POINTS[activeDrm].color + '80' }}>
                    qos-runtime / license_enforcer.rs
                  </span>
                  <span className="ml-auto flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: DRM_POINTS[activeDrm].color }} />
                    <span className="font-mono-code text-[9px] text-gray-600">ENFORCED</span>
                  </span>
                </div>
                <div className="bg-[#050505] p-6">
                  <pre className="font-mono-code text-[12px] leading-relaxed overflow-auto text-gray-300">
                    <code style={{ color: DRM_POINTS[activeDrm].color + 'cc' }}>{DRM_POINTS[activeDrm].code}</code>
                  </pre>
                </div>
              </motion.div>

              {/* Security guarantees */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: 'Sig Algorithm', value: 'Ed25519', c: '#00ff41' },
                  { label: 'Hash Function', value: 'SHA-256', c: '#00d4ff' },
                  { label: 'License Binding', value: 'Node ID', c: '#facc15' },
                  { label: 'Verification', value: '100% Offline', c: '#c792ea' },
                ].map(g => (
                  <div key={g.label} className="rounded-xl bg-[#0d0d0d] border border-white/5 px-4 py-3">
                    <p className="font-mono-code text-[9px] text-gray-600 uppercase tracking-widest mb-1">{g.label}</p>
                    <p className="font-mono-code text-sm font-bold" style={{ color: g.c }}>{g.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: '-80px' }}
          className="max-w-4xl mx-auto text-center rounded-3xl border border-[#c792ea]/20 p-16 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(199,146,234,0.06), #0a0a0a, rgba(0,255,65,0.04))' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px" style={{ background: 'linear-gradient(to right, transparent, #c792ea60, transparent)' }} />
          <p className="font-mono-code text-[#c792ea] text-[11px] tracking-widest uppercase mb-5">Ready to monetize?</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
            Your module.<br /><span style={{ color: '#c792ea' }}>Your revenue.</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Generate your Ed25519 keypair, sign your first module, and list it on the Q-OS Registry in under 10 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/developers"
              className="px-10 py-4 text-sm font-bold font-mono-code rounded-xl tracking-widest uppercase hover:scale-105 transition-all text-[#0a0a0a]"
              style={{ background: '#c792ea', boxShadow: '0 0 35px rgba(199,146,234,0.4)' }}>
              Start Publishing →
            </Link>
            <Link href="/registry"
              className="font-mono-code text-sm text-gray-500 hover:text-[#c792ea] tracking-widest transition-colors">
              Browse the Registry
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
