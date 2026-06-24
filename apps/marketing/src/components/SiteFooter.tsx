"use client";

import { usePathname } from 'next/navigation';

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname === '/docs/quick-start') {
    return null;
  }

  return (
    <footer className="border-t border-[#00d4ff]/10 mt-32 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="font-mono-code text-[#00ff41] font-bold text-lg tracking-widest">Q-OS</span>
          <span className="text-gray-600 font-mono-code text-xs">v0.1.0-alpha</span>
        </div>
        <p className="text-gray-600 text-sm font-mono-code">
          © 2026 Q-OS Protocol. Built on Rust. Open Source.
        </p>
        <div className="flex items-center gap-6 text-xs text-gray-500 font-mono-code">
          <a href="/features" className="hover:text-[#00d4ff] transition-colors">Features</a>
          <a href="/developers" className="hover:text-[#00d4ff] transition-colors">Developers</a>
          <a href="/pricing" className="hover:text-[#00d4ff] transition-colors">Pricing</a>
          <a href="https://github.com/donwolfonline/QOS" className="hover:text-[#00ff41] transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
