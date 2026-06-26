'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import { MODULES, CATEGORIES, CATEGORY_COLORS, type Category, type Module } from '@/lib/registry-data';

// ─── Module Card ───────────────────────────────────────────────────────────────
function ModuleCard({ mod, index }: { mod: Module; index: number }) {
  return (
    <Link href={`/m/${encodeURIComponent(mod.slug)}`} className="block h-full">
      <motion.div
        layout
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.93, y: 10 }}
        transition={{ duration: 0.25, delay: index * 0.04, type: 'spring', stiffness: 100 }}
        whileHover={{ y: -6, scale: 1.02 }}
        className="text-left h-full w-full p-5 rounded-2xl bg-white/[0.02] border group cursor-pointer transition-all duration-300 flex flex-col gap-4 relative overflow-hidden backdrop-blur-md"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = mod.color + '50';
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${mod.color}15, inset 0 0 20px ${mod.color}05`;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        }}
      >
        {/* Corner glow */}
        <div
          className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-[50px] opacity-0 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none"
          style={{ background: mod.color }}
        />

        {/* Top row */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border"
              style={{ background: mod.color + '12', borderColor: mod.color + '30' }}
            >
              {mod.icon}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono-code text-sm font-bold text-white group-hover:text-[#fff] transition-colors">
                  {mod.name}
                </span>
                {mod.verified && (
                  <span className="text-[#00ff41] text-[10px]" title="Official">✓</span>
                )}
              </div>
              <span className="text-gray-600 text-[11px] font-mono-code">by {mod.author}</span>
            </div>
          </div>
          <span
            className="font-mono-code text-[9px] uppercase tracking-widest px-2 py-1 rounded-full border shrink-0 mt-0.5 backdrop-blur-sm"
            style={{
              color: CATEGORY_COLORS[mod.category],
              borderColor: CATEGORY_COLORS[mod.category] + '40',
              background: CATEGORY_COLORS[mod.category] + '10',
            }}
          >
            {mod.category}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 relative z-10 group-hover:text-gray-400 transition-colors">
          {mod.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto relative z-10">
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
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-32 px-6 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-[#00ff41]/4 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-1/3 right-[-10%] w-[500px] h-[500px] bg-[#7c3aed]/4 blur-[130px] pointer-events-none rounded-full" />

      {/* ── Hero Header ───────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto text-center mb-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 border border-[#00ff41]/30 bg-[#00ff41]/5 rounded-full px-4 py-1.5 mb-6 backdrop-blur-md"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse" />
          <span className="font-mono-code text-[#00ff41] text-[11px] tracking-widest uppercase">
            {MODULES.length} Modules Available
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-black text-white tracking-tight mb-5 font-mono-code leading-tight"
        >
          Module{' '}
          <span className="text-gradient-green">Registry</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.25 }}
          className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed"
        >
          The App Store for the Physical World. Deploy WASM logic to your edge node in one command.
        </motion.p>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">

        {/* ── Frosted Glass Search + Sort Bar ───────────────────────────── */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 mb-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl"
        >
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
              className="w-full bg-white/[0.03] border border-white/8 rounded-xl pl-10 pr-4 py-3 font-mono-code text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-[#00d4ff]/50 focus:bg-[#00d4ff]/3 transition-all"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors">✕</button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value as typeof sort)}
            className="bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 font-mono-code text-sm text-gray-400 focus:outline-none focus:border-[#00d4ff]/40 cursor-pointer transition-colors"
          >
            <option value="popular">↓ Most Popular</option>
            <option value="newest">↓ Newest</option>
            <option value="cpu">↓ Lowest CPU</option>
          </select>
        </motion.div>

        {/* ── Category Filters ───────────────────────────────────────────── */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {CATEGORIES.map(cat => {
            const catColor = cat === 'All' ? '#00ff41' : CATEGORY_COLORS[cat] ?? '#00ff41';
            const isActive = activeCategory === cat;
            return (
              <motion.button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="font-mono-code text-xs uppercase tracking-widest px-4 py-2 rounded-xl border transition-all duration-200 backdrop-blur-md"
                style={isActive ? {
                  background: catColor,
                  borderColor: 'transparent',
                  color: '#000',
                  fontWeight: 'bold',
                  boxShadow: `0 0 20px ${catColor}50`,
                } : {
                  color: 'rgb(107 114 128)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                {cat}
              </motion.button>
            );
          })}
        </motion.div>

        {/* ── Results count ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <p className="font-mono-code text-xs text-gray-700">
            {filtered.length === 0 ? 'No modules found.' : `${filtered.length} module${filtered.length !== 1 ? 's' : ''}`}
            {activeCategory !== 'All' && <span className="text-[#00d4ff]"> in {activeCategory}</span>}
            {query && <span> matching "<span className="text-white">{query}</span>"</span>}
          </p>
          {(query || activeCategory !== 'All') && (
            <button
              onClick={() => { setQuery(''); setActiveCategory('All'); }}
              className="font-mono-code text-[11px] text-gray-600 hover:text-[#00d4ff] transition-colors"
            >
              Clear filters ✕
            </button>
          )}
        </div>

        {/* ── Module Grid ───────────────────────────────────────────────── */}
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((mod, i) => (
              <ModuleCard key={mod.id} mod={mod} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 flex flex-col items-center gap-4"
          >
            <span className="text-5xl">🔍</span>
            <p className="font-mono-code text-gray-600 text-sm">No modules match your search.</p>
            <button
              onClick={() => { setQuery(''); setActiveCategory('All'); }}
              className="font-mono-code text-xs text-[#00d4ff] border border-[#00d4ff]/30 px-4 py-2 rounded-lg hover:bg-[#00d4ff]/10 transition-colors"
            >
              Reset filters
            </button>
          </motion.div>
        )}

        {/* ── Submit CTA ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 p-10 rounded-2xl border border-dashed border-[#00d4ff]/20 bg-white/[0.02] text-center backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-[#00d4ff]/5 blur-[80px] pointer-events-none" />
          <p className="text-3xl mb-4 relative z-10">🧩</p>
          <h3 className="font-mono-code text-white font-bold text-xl mb-2 relative z-10">Built something useful?</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto relative z-10 leading-relaxed">
            Publish your WASM module to the registry. Earn recurring revenue with cryptographic Ed25519 licensing.
          </p>
          <motion.a
            whileHover={{ scale: 1.04 }}
            href="https://github.com/donwolfonline/QOS"
            className="relative z-10 inline-block font-mono-code text-sm text-[#00d4ff] border border-[#00d4ff]/30 px-8 py-3 rounded-xl hover:bg-[#00d4ff]/10 transition-colors backdrop-blur-md shadow-[0_0_20px_rgba(0,212,255,0.1)] hover:shadow-[0_0_30px_rgba(0,212,255,0.2)]"
          >
            Submit to Registry →
          </motion.a>
        </motion.div>
      </div>
    </div>
  );
}
