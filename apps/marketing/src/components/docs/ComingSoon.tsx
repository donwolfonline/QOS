import Link from 'next/link';

interface ComingSoonProps {
  title: string;
  category: string;
  categoryColor: string;
  prev?: { label: string; href: string };
  next?: { label: string; href: string };
  topics?: string[];
}

export function ComingSoon({ title, category, categoryColor, prev, next, topics }: ComingSoonProps) {
  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="pb-8 border-b border-[#00d4ff]/10">
        <span
          className="font-mono-code text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border mb-4 inline-block"
          style={{ color: categoryColor, borderColor: categoryColor + '40', background: categoryColor + '10' }}
        >
          {category}
        </span>
        <h1 className="text-4xl font-black text-white tracking-tight mb-4 font-mono-code">{title}</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: categoryColor }} />
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: categoryColor, animationDelay: '0.2s' }} />
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: categoryColor, animationDelay: '0.4s' }} />
          </div>
          <p className="font-mono-code text-sm text-gray-500">This page is under active development.</p>
        </div>
      </div>

      {/* Coming soon card */}
      <div
        className="rounded-2xl border p-10 text-center relative overflow-hidden"
        style={{ borderColor: categoryColor + '25', background: categoryColor + '06' }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${categoryColor}80, transparent)` }}
        />
        <div className="text-5xl mb-5">🚧</div>
        <h2 className="text-xl font-bold text-white mb-3 font-mono-code">{title}</h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed mb-8">
          Full documentation for this section is being written. In the meantime, check the
          Quick Start guide or open an issue on GitHub if you need this content urgently.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/docs/quick-start"
            className="px-6 py-2.5 font-mono-code text-sm font-bold text-black rounded-lg tracking-widest uppercase transition-all hover:opacity-90"
            style={{ background: categoryColor }}>
            Read Quick Start
          </Link>
          <a
            href="https://github.com/donwolfonline/QOS/issues"
            target="_blank" rel="noopener noreferrer"
            className="px-6 py-2.5 font-mono-code text-sm text-gray-400 border border-gray-700 rounded-lg hover:border-gray-500 hover:text-gray-200 transition-colors">
            Request on GitHub ↗
          </a>
        </div>
      </div>

      {/* Topics preview */}
      {topics && topics.length > 0 && (
        <div>
          <p className="font-mono-code text-[10px] uppercase tracking-widest text-gray-700 mb-4">Topics this page will cover</p>
          <div className="flex flex-col gap-2">
            {topics.map((t, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#111] border border-[#00d4ff]/8">
                <span className="font-mono-code text-gray-700 text-xs">0{i + 1}</span>
                <span className="text-gray-500 text-sm">{t}</span>
                <span className="ml-auto font-mono-code text-[9px] text-gray-700 uppercase tracking-widest">Soon</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prev / Next navigation */}
      {(prev || next) && (
        <div className="flex items-center justify-between pt-8 border-t border-[#00d4ff]/10 mt-4">
          {prev ? (
            <Link href={prev.href} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              <span>{prev.label}</span>
            </Link>
          ) : <div />}
          {next ? (
            <Link href={next.href} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
              <span>{next.label}</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          ) : <div />}
        </div>
      )}
    </div>
  );
}
