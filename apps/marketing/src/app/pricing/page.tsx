'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PLANS = [
  {
    name: 'Community',
    price: 'Free',
    period: 'forever',
    description: 'Everything you need to run Q-OS on your own hardware. No limits, no telemetry, no strings attached.',
    color: '#00d4ff',
    cta: 'Deploy Now',
    ctaHref: '/developers',
    highlight: false,
    features: [
      'Unlimited WASM modules',
      'Unlimited edge nodes & endpoints',
      'Full REST API access',
      'Live WebSocket telemetry stream',
      'CRDT P2P state sync (libp2p)',
      'Community support (GitHub)',
      'Self-hosted on your hardware',
    ],
  },
  {
    name: 'Pro',
    price: '$49',
    period: 'per network / month',
    description: 'Managed cloud dashboard, priority support, and advanced analytics for growing edge networks.',
    color: '#00ff41',
    cta: 'Start Free Trial',
    ctaHref: '#',
    highlight: true,
    features: [
      'Everything in Community',
      'Managed cloud Admin HUD',
      'Advanced analytics & reporting',
      'Email + Slack priority support',
      'Automated WASM module updates',
      'Multi-network fleet management',
      'Uptime SLA: 99.9%',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact sales',
    description: 'White-label, custom integrations, dedicated infrastructure, and enterprise SLA for enterprise deployments.',
    color: '#7c3aed',
    cta: 'Talk to Us',
    ctaHref: 'mailto:enterprise@q-os.io',
    highlight: false,
    features: [
      'Everything in Pro',
      'White-label branding',
      'Dedicated Rust edge nodes',
      'Custom WASM SDK development',
      'Custom IoT integration',
      'SOC 2 compliance (roadmap)',
      'Dedicated account manager',
    ],
  },
];

const FAQ = [
  {
    q: 'Is Q-OS really free forever?',
    a: 'Yes. The core runtime is MIT-licensed open source. You can self-host on any machine, run unlimited modules, and serve unlimited guests with zero cost.',
  },
  {
    q: 'What does "self-hosted" mean in practice?',
    a: 'You run the qos-api Rust binary on a Mac Mini, Raspberry Pi, or any Linux server inside your venue. No data ever leaves your local network.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Absolutely. Upgrade or downgrade at any time. When upgrading to Pro, your self-hosted data migrates seamlessly.',
  },
  {
    q: 'Does it work without internet?',
    a: 'Yes. Q-OS is designed local-first. Guests can check in and modules execute even if your broadband connection drops. The Sled DB persists all state on disk.',
  },
];

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="border-b border-white/5"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-5 flex items-center justify-between text-left group"
      >
        <h3 className="text-white font-semibold group-hover:text-[#00d4ff] transition-colors pr-4">{q}</h3>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-500 text-xl shrink-0 font-mono-code group-hover:text-[#00d4ff] transition-colors"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="text-gray-400 text-sm leading-relaxed pb-5">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
};
const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 80, damping: 15 } }
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-32 px-6 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#00ff41]/5 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-[-10%] w-[600px] h-[600px] bg-[#7c3aed]/5 blur-[130px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00d4ff]/20 bg-[#00d4ff]/5 mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse"></span>
            <span className="font-mono-code text-[#00d4ff] text-[11px] tracking-widest uppercase">Pricing</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
            Start free.<br /><span className="text-gradient-green">Scale when ready.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            No credit card required. No surprise bills. Q-OS is open source and runs
            on your own hardware forever.
          </p>
        </motion.div>

        {/* Plans Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-3 gap-6 mb-28"
        >
          {PLANS.map(plan => (
            <motion.div
              key={plan.name}
              variants={cardVariants}
              whileHover={{ y: -8, transition: { type: 'spring', stiffness: 200 } }}
              className={`relative rounded-2xl p-8 flex flex-col border transition-all duration-300 backdrop-blur-xl overflow-hidden ${
                plan.highlight
                  ? 'border-[#00ff41]/35 shadow-[0_0_60px_rgba(0,255,65,0.12),inset_0_0_40px_rgba(0,255,65,0.04)]'
                  : 'border-white/5 hover:border-white/10'
              }`}
              style={{
                background: plan.highlight
                  ? 'linear-gradient(160deg, rgba(0,255,65,0.06) 0%, rgba(10,10,10,0.95) 50%)'
                  : 'rgba(255,255,255,0.02)',
              }}
            >
              {/* Ambient corner glow */}
              <div
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-[60px] opacity-20 pointer-events-none"
                style={{ background: plan.color }}
              />

              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-5 py-1 bg-[#00ff41] text-black text-[10px] font-bold font-mono-code tracking-widest uppercase rounded-full shadow-[0_0_20px_rgba(0,255,65,0.4)] z-10">
                  Most Popular
                </div>
              )}

              <div className="mb-8 relative z-10">
                <p className="font-mono-code text-xs uppercase tracking-widest mb-3" style={{ color: plan.color }}>
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-black text-white">{plan.price}</span>
                  <span className="text-gray-500 text-sm font-mono-code">{plan.period}</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{plan.description}</p>
              </div>

              <ul className="flex flex-col gap-3.5 mb-8 flex-1 relative z-10">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                      style={{ color: plan.color }}
                      className="mt-0.5 shrink-0 text-base leading-none"
                    >
                      ✓
                    </motion.span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={plan.highlight
                  ? 'relative z-10 text-center py-3.5 rounded-xl font-bold font-mono-code text-sm tracking-widest uppercase transition-all active:scale-95 hover:scale-[1.02] bg-[#00ff41] text-black shadow-[0_0_25px_rgba(0,255,65,0.4)] hover:shadow-[0_0_40px_rgba(0,255,65,0.6)]'
                  : 'relative z-10 text-center py-3.5 rounded-xl font-bold font-mono-code text-sm tracking-widest uppercase transition-all active:scale-95 hover:scale-[1.02] border backdrop-blur-md hover:bg-white/5'
                }
                style={plan.highlight ? {} : { borderColor: plan.color + '50', color: plan.color }}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-white mb-10 text-center"
          >
            Frequently Asked <span className="text-gradient-blue">Questions</span>
          </motion.h2>
          <div className="flex flex-col p-8 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl">
            {FAQ.map(({ q, a }, i) => (
              <FAQItem key={q} q={q} a={a} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
