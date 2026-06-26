'use client';

import type { Metadata } from 'next';
import Link from 'next/link';
import { motion } from 'framer-motion';

const FEATURES = [
  {
    icon: '⚡',
    title: 'Live Edge Topology',
    desc: 'See every edge node in real-time. State updates propagate across the local mesh via CRDT sync in under 50ms — no polling, no page refresh.',
    color: '#00d4ff',
    tag: 'Real-time',
  },
  {
    icon: '🧩',
    title: 'Hot-Swap Logic Modules',
    desc: 'Deploy new WASM modules and switch edge logic instantly without touching physical hardware or restarting nodes. Manage fleets with one click in the Admin HUD.',
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15
    }
  }
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-32 px-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#00d4ff]/5 blur-[120px] pointer-events-none rounded-full mix-blend-screen" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#00ff41]/5 blur-[120px] pointer-events-none rounded-full mix-blend-screen" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00d4ff]/20 bg-[#00d4ff]/5 mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse"></span>
            <p className="font-mono-code text-[#00d4ff] text-[11px] tracking-widest uppercase">For Businesses</p>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
            Built for venues that <br className="hidden md:block" />
            <span className="text-gradient-green">refuse to wait.</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Every feature is designed around one principle: your staff should never be blocked
            by software. Q-OS runs locally, reacts instantly, and costs nothing extra.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              key={f.title}
              className="group p-8 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 transition-all duration-500 relative overflow-hidden"
              style={{
                boxShadow: `0 4px 24px -10px ${f.color}15`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${f.color}40`;
                e.currentTarget.style.boxShadow = `0 10px 40px -10px ${f.color}30, inset 0 0 20px ${f.color}0a`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.boxShadow = `0 4px 24px -10px ${f.color}15`;
              }}
            >
              {/* Internal glow orb */}
              <div
                className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[40px] opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"
                style={{ background: f.color }}
              />
              
              <div className="flex items-start justify-between mb-8 relative z-10">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-inner border border-white/10"
                  style={{ background: `linear-gradient(135deg, ${f.color}20, transparent)` }}
                >
                  <motion.span 
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="inline-block"
                  >
                    {f.icon}
                  </motion.span>
                </div>
                <span
                  className="font-mono-code text-[10px] px-3 py-1.5 rounded-full border uppercase tracking-widest backdrop-blur-md"
                  style={{ color: f.color, borderColor: f.color + '30', background: f.color + '10' }}
                >
                  {f.tag}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 relative z-10 group-hover:text-transparent group-hover:bg-clip-text transition-colors duration-300"
                  style={{ backgroundImage: `linear-gradient(90deg, #fff, ${f.color})` }}>
                {f.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed relative z-10 group-hover:text-gray-300 transition-colors">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-32 relative"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[100px] bg-[#00ff41]/20 blur-[60px] pointer-events-none" />
          
          <p className="text-gray-500 mb-6 font-mono-code text-sm uppercase tracking-widest relative z-10">Ready to see it live?</p>
          <Link
            href="/developers"
            className="relative z-10 inline-block px-12 py-5 font-bold font-mono-code text-black bg-gradient-to-r from-[#00ff41] to-[#00d4ff] rounded-xl tracking-widest uppercase shadow-[0_0_40px_rgba(0,255,65,0.4)] hover:shadow-[0_0_60px_rgba(0,255,65,0.6)] hover:scale-[1.03] transition-all duration-300"
          >
            Start Building — Free
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
