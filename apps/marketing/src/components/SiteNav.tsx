'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { href: '/features', label: 'For Businesses' },
  { href: '/developers', label: 'For Engineers' },
  { href: '/registry', label: 'Registry' },
  { href: '/pricing', label: 'Pricing' },
];

export function SiteNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-[#00d4ff]/10 shadow-[0_4px_30px_rgba(0,212,255,0.05)]'
            : 'bg-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded border border-[#00ff41]/50 group-hover:border-[#00ff41] transition-colors duration-300" />
              <div className="absolute inset-0 rounded bg-[#00ff41]/5 group-hover:bg-[#00ff41]/10 transition-colors duration-300" />
              <span className="font-mono-code text-[#00ff41] text-xs font-black relative z-10 group-hover:drop-shadow-[0_0_8px_#00ff41] transition-all">Q</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono-code text-white font-bold text-lg tracking-widest group-hover:text-[#00ff41] transition-colors duration-300">
                Q-OS
              </span>
              <span className="font-mono-code text-[10px] text-[#00d4ff]/60 tracking-widest uppercase hidden sm:block">
                protocol
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative px-4 py-2 text-sm font-medium tracking-wide transition-colors duration-200 rounded-lg group ${
                    isActive ? 'text-[#00d4ff]' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/20"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/docs"
              className="text-sm text-gray-400 hover:text-[#00d4ff] transition-colors duration-200 font-mono-code tracking-wide"
            >
              Read the Docs ↗
            </Link>
            <Link
              href="/developers"
              className="relative px-5 py-2 text-sm font-bold font-mono-code text-black bg-[#00ff41] rounded-lg tracking-widest uppercase hover:bg-[#00ff41]/90 transition-all duration-200 shadow-[0_0_20px_rgba(0,255,65,0.3)] hover:shadow-[0_0_30px_rgba(0,255,65,0.5)] active:scale-95"
            >
              Start Building
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="md:hidden flex flex-col gap-1.5 p-2 text-gray-400 hover:text-[#00ff41] transition-colors"
            aria-label="Toggle menu"
          >
            <motion.span
              animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="block w-5 h-0.5 bg-current origin-center transition-colors"
            />
            <motion.span
              animate={mobileOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
              className="block w-5 h-0.5 bg-current"
            />
            <motion.span
              animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="block w-5 h-0.5 bg-current origin-center transition-colors"
            />
          </button>
        </nav>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-[#00d4ff]/15 md:hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`font-mono-code text-sm tracking-widest uppercase py-2 border-b border-[#00d4ff]/10 transition-colors ${
                    pathname === href ? 'text-[#00d4ff]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                <Link
                  href="/docs"
                  className="text-center py-2 text-sm text-gray-400 font-mono-code border border-[#00d4ff]/20 rounded-lg hover:border-[#00d4ff]/50 hover:text-[#00d4ff] transition-colors"
                >
                  Read the Docs ↗
                </Link>
                <Link
                  href="/developers"
                  className="text-center py-3 text-sm font-bold font-mono-code text-black bg-[#00ff41] rounded-lg tracking-widest uppercase shadow-[0_0_20px_rgba(0,255,65,0.3)]"
                >
                  Start Building
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
