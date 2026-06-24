'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import { MODULES, CATEGORIES, CATEGORY_COLORS, type Category, type Module } from '@/lib/registry-data';



// ─── Module Card ───────────────────────────────────────────────────────────────
function ModuleCard({ mod }: { mod: Module }) {
  return (
    <Link href={`/m/${encodeURIComponent(mod.slug)}`} className="block">
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.25 }}
        className="text-left h-full w-full p-5 rounded-2xl bg-[#111111] border group cursor-pointer transition-all duration-300 flex flex-col gap-4 relative overflow-hidden"
        style={{ borderColor: 'rgba(0,212,255,0.10)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = mod.color + '40'; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px ${mod.color}0d`; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.10)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
      >
        {/* Hover glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% -20%, ${mod.color}0a, transparent 70%)` }} />

        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border"
              style={{ background: mod.color + '0d', borderColor: mod.color + '30' }}>
              {mod.icon}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono-code text-sm font-bold text-white">{mod.name}</span>
                {mod.verified && <span className="text-[#00ff41] text-[10px]" title="Official">✓</span>}
              </div>
              <span className="text-gray-600 text-[11px] font-mono-code">by {mod.author}</span>
            </div>
          </div>
          <span className="font-mono-code text-[9px] uppercase tracking-widest px-2 py-1 rounded-full border shrink-0 mt-0.5"
            style={{ color: CATEGORY_COLORS[mod.category], borderColor: CATEGORY_COLORS[mod.category] + '40', background: CATEGORY_COLORS[mod.category] + '10' }}>
            {mod.category}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{mod.description}</p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3">
            <span className="font-mono-code text-[10px] text-gray-700 flex items-center gap-1">
              <span style={{ color: mod.color }}>⚡</span> {mod.cpu}
            </span>
            <span className="font-mono-code text-[10px] text-gray-700 flex items-center gap-1">
              <span className="text-gray-600">💾</span> {mod.ram}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono-code text-[10px] text-gray-600">↓ {mod.downloads}</span>
            <span className="font-mono-code text-[10px] text-gray-700">v{mod.version}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RegistryPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [sort, setSort] = useState<'popular' | 'newest' | 'cpu'>('popular');

  const filtered = useMemo(() => {
    let list = [...MODULES];
    if (activeCategory !== 'All') list = list.filter(m => m.category === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.tags.some(t => t.includes(q)) ||
        m.author.toLowerCase().includes(q)
      );
    }
    if (sort === 'popular') list.sort((a, b) => parseFloat(b.downloads) - parseFloat(a.downloads));
    if (sort === 'cpu') list.sort((a, b) => parseFloat(a.cpu) - parseFloat(b.cpu));
    return list;
  }, [query, activeCategory, sort]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-32 px-6">

      {/* ── Hero Header ───────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto text-center mb-16">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 border border-[#00ff41]/30 bg-[#00ff41]/5 rounded-full px-4 py-1.5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse" />
          <span className="font-mono-code text-[#00ff41] text-[11px] tracking-widest uppercase">{MODULES.length} Modules Available</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-5xl md:text-6xl font-black text-white tracking-tight mb-5 font-mono-code">
          Module Registry
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
          The App Store for the Physical World. Deploy WASM logic to your venue in one command.
        </motion.p>
      </div>

      <div className="max-w-6xl mx-auto">

        {/* ── Search + Sort Bar ──────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search modules, authors, tags..."
              className="w-full bg-[#111] border border-[#00d4ff]/15 rounded-xl pl-10 pr-4 py-3 font-mono-code text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-[#00d4ff]/50 transition-colors"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">✕</button>
            )}
          </div>

          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
            className="bg-[#111] border border-[#00d4ff]/15 rounded-xl px-4 py-3 font-mono-code text-sm text-gray-400 focus:outline-none focus:border-[#00d4ff]/40 cursor-pointer transition-colors">
            <option value="popular">↓ Most Popular</option>
            <option value="newest">↓ Newest</option>
            <option value="cpu">↓ Lowest CPU</option>
          </select>
        </div>

        {/* ── Category Filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`font-mono-code text-xs uppercase tracking-widest px-4 py-2 rounded-xl border transition-all duration-200 ${
                activeCategory === cat ? 'text-black font-bold scale-105' : 'text-gray-500 border-[#00d4ff]/12 hover:border-[#00d4ff]/30 hover:text-gray-300'
              }`}
              style={activeCategory === cat
                ? { background: cat === 'All' ? '#00ff41' : CATEGORY_COLORS[cat] ?? '#00ff41', borderColor: 'transparent', boxShadow: `0 0 16px ${cat === 'All' ? '#00ff41' : CATEGORY_COLORS[cat] ?? '#00ff41'}50` }
                : {}}>
              {cat}
            </button>
          ))}
        </div>

        {/* ── Results count ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <p className="font-mono-code text-xs text-gray-700">
            {filtered.length === 0 ? 'No modules found.' : `${filtered.length} module${filtered.length !== 1 ? 's' : ''}`}
            {activeCategory !== 'All' && <span className="text-[#00d4ff]"> in {activeCategory}</span>}
            {query && <span> matching "<span className="text-white">{query}</span>"</span>}
          </p>
          {(query || activeCategory !== 'All') && (
            <button onClick={() => { setQuery(''); setActiveCategory('All'); }}
              className="font-mono-code text-[11px] text-gray-600 hover:text-[#00d4ff] transition-colors">
              Clear filters ✕
            </button>
          )}
        </div>

        {/* ── Module Grid ───────────────────────────────────────────────── */}
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map(mod => (
              <ModuleCard key={mod.id} mod={mod} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-24 flex flex-col items-center gap-4">
            <span className="text-5xl">🔍</span>
            <p className="font-mono-code text-gray-600 text-sm">No modules match your search.</p>
            <button onClick={() => { setQuery(''); setActiveCategory('All'); }}
              className="font-mono-code text-xs text-[#00d4ff] border border-[#00d4ff]/30 px-4 py-2 rounded-lg hover:bg-[#00d4ff]/10 transition-colors">
              Reset filters
            </button>
          </motion.div>
        )}

        {/* ── Submit CTA ────────────────────────────────────────────────── */}
        <div className="mt-20 p-8 rounded-2xl border border-dashed border-[#00d4ff]/20 bg-[#00d4ff]/3 text-center">
          <p className="text-2xl mb-3">🧩</p>
          <h3 className="font-mono-code text-white font-bold mb-2">Built something useful?</h3>
          <p className="text-gray-500 text-sm mb-5 max-w-sm mx-auto">
            Publish your WASM module to the registry and share it with the Q-OS community.
          </p>
          <a href="https://github.com/donwolfonline/QOS"
            className="inline-block font-mono-code text-sm text-[#00d4ff] border border-[#00d4ff]/30 px-6 py-2.5 rounded-lg hover:bg-[#00d4ff]/10 transition-colors">
            Submit to Registry →
          </a>
        </div>
      </div>

    </div>
  );
}
