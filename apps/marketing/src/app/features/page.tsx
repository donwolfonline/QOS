import type { Metadata } from 'next';
import Link from 'next/link';
import { motion } from 'framer-motion';

export const metadata: Metadata = {
  title: 'Features — For Businesses',
  description:
    'Discover how Q-OS transforms restaurants, bars, and venues into real-time programmable compute surfaces. Live floor plans, dynamic modules, zero-cloud infrastructure.',
  openGraph: {
    title: 'Q-OS Features — For Businesses',
    description: 'Real-time floor plans, WASM module hot-swapping, and zero-cloud venue infrastructure.',
    url: 'https://q-os.io/features',
  },
};

const FEATURES = [
  {
    icon: '⚡',
    title: 'Live Floor Plan',
    desc: 'See every table, every guest, in real-time. Occupancy updates propagate via CRDT sync in under 50ms — no polling, no page refresh.',
    color: '#00d4ff',
    tag: 'Real-time',
  },
  {
    icon: '🧩',
    title: 'Hot-Swap Logic Modules',
    desc: 'Switch from "Guestbook" to "Happy Hour Menu" to "VIP Checkout" mid-service without reprinting a single QR code. One click in the Admin HUD.',
    color: '#00ff41',
    tag: 'Zero Downtime',
  },
  {
    icon: '📡',
    title: 'System Broadcasts',
    desc: 'Push INFO, OFFER, or WARNING messages to all active guest sessions simultaneously. Run flash promotions in seconds.',
    color: '#00ff41',
    tag: 'Real-time Push',
  },
  {
    icon: '📊',
    title: 'Transaction Feed',
    desc: 'A Fira Code terminal-style log of every check-in, module trigger, and payload execution with microsecond-precision timestamps.',
    color: '#00d4ff',
    tag: 'Analytics',
  },
  {
    icon: '🔒',
    title: 'API Key Auth',
    desc: 'Every admin endpoint is protected by a cryptographic API key enforced at the Rust middleware layer. Zero unauthenticated access.',
    color: '#ff003c',
    tag: 'Security',
  },
  {
    icon: '🌐',
    title: 'Works Offline',
    desc: 'The Sled K/V state store persists on disk. When internet goes down, Q-OS keeps running. Guests still check in, staff still get updates.',
    color: '#00ff41',
    tag: 'Resilient',
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-24">
          <p className="font-mono-code text-[#00d4ff] text-xs tracking-widest uppercase mb-4">&gt;_ For Businesses</p>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6">
            Built for venues that <span className="text-gradient-green">refuse to wait.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Every feature is designed around one principle: your staff should never be blocked
            by software. Q-OS runs locally, reacts instantly, and costs nothing extra.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="group p-8 rounded-2xl bg-[#111111] border border-[#00d4ff]/10 hover:border-[#00d4ff]/30 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
            >
              <div
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: f.color + '18' }}
              />
              <div className="flex items-start justify-between mb-6">
                <span className="text-3xl">{f.icon}</span>
                <span
                  className="font-mono-code text-[10px] px-2 py-1 rounded-full border uppercase tracking-widest"
                  style={{ color: f.color, borderColor: f.color + '40', background: f.color + '10' }}
                >
                  {f.tag}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-24">
          <p className="text-gray-500 mb-6 font-mono-code text-sm">Ready to see it live?</p>
          <Link
            href="/developers"
            className="inline-block px-10 py-4 font-bold font-mono-code text-black bg-[#00ff41] rounded-xl tracking-widest uppercase shadow-[0_0_30px_rgba(0,255,65,0.35)] hover:shadow-[0_0_50px_rgba(0,255,65,0.5)] hover:scale-105 transition-all"
          >
            Start Building — Free
          </Link>
        </div>
      </div>
    </div>
  );
}
