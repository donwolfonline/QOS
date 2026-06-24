import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Q-OS is free and open source. Run it yourself forever, or get priority support and managed infrastructure with our Pro and Enterprise plans.',
  openGraph: {
    title: 'Q-OS Pricing — Free, Pro, and Enterprise',
    description: 'Self-host free forever. Scale with Pro. Enterprise SLA available.',
    url: 'https://q-os.io/pricing',
  },
};

const PLANS = [
  {
    name: 'Community',
    price: 'Free',
    period: 'forever',
    description: 'Everything you need to run Q-OS on your own hardware. No limits, no telemetry, no strings.',
    color: '#00d4ff',
    cta: 'Deploy Now',
    ctaHref: '/developers',
    highlight: false,
    features: [
      'Unlimited WASM modules',
      'Unlimited tables / QR codes',
      'Full REST API access',
      'Live WebSocket stream',
      'CRDT state sync',
      'Community support (GitHub)',
      'Self-hosted on your hardware',
    ],
  },
  {
    name: 'Pro',
    price: '$49',
    period: 'per venue / month',
    description: 'Managed cloud dashboard, priority support, and advanced analytics for growing venues.',
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
      'Multi-venue fleet management',
      'Uptime SLA: 99.9%',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact sales',
    description: 'White-label, custom integrations, dedicated infrastructure, and enterprise SLA for chains and franchises.',
    color: '#7c3aed',
    cta: 'Talk to Us',
    ctaHref: 'mailto:enterprise@q-os.io',
    highlight: false,
    features: [
      'Everything in Pro',
      'White-label branding',
      'Dedicated Rust edge nodes',
      'Custom WASM SDK development',
      'POS system integration',
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
    a: 'Yes. Q-OS is designed local-first. Guests can check in and modules execute even if your broadband connection drops.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-32 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-20">
          <p className="font-mono-code text-[#00d4ff] text-xs tracking-widest uppercase mb-4">&gt;_ Pricing</p>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6">
            Start free.<br /><span className="text-gradient-green">Scale when ready.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            No credit card required. No surprise bills. Q-OS is open source and runs
            on your own hardware forever.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-24">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col border transition-all duration-300 hover:-translate-y-1 ${
                plan.highlight
                  ? 'bg-gradient-to-b from-[#00ff41]/10 to-[#0a0a0a] border-[#00ff41]/40 shadow-[0_0_40px_rgba(0,255,65,0.12)]'
                  : 'bg-[#111111] border-[#00d4ff]/15 hover:border-[#00d4ff]/30'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#00ff41] text-black text-[10px] font-bold font-mono-code tracking-widest uppercase rounded-full">
                  Most Popular
                </div>
              )}
              <div className="mb-8">
                <p className="font-mono-code text-xs uppercase tracking-widest mb-2" style={{ color: plan.color }}>
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-gray-500 text-sm font-mono-code">{plan.period}</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{plan.description}</p>
              </div>

              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                    <span style={{ color: plan.color }} className="mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`text-center py-3 rounded-xl font-bold font-mono-code text-sm tracking-widest uppercase transition-all active:scale-95 ${
                  plan.highlight
                    ? 'bg-[#00ff41] text-black shadow-[0_0_20px_rgba(0,255,65,0.35)] hover:shadow-[0_0_35px_rgba(0,255,65,0.5)]'
                    : 'border text-gray-300 hover:text-white'
                }`}
                style={!plan.highlight ? { borderColor: plan.color + '40', color: plan.color } : {}}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-10 text-center">Frequently Asked Questions</h2>
          <div className="flex flex-col divide-y divide-[#00d4ff]/10">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="py-6">
                <h3 className="text-white font-semibold mb-3">{q}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
