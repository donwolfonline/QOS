"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Fuse, { FuseResult } from "fuse.js";

type DocIndexItem = {
  title: string;
  category: string;
  href: string;
  content: string;
};

export function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FuseResult<DocIndexItem>[]>([]);
  const [index, setIndex] = useState<DocIndexItem[]>([]);
  const [fuse, setFuse] = useState<Fuse<DocIndexItem> | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fetch index on mount
  useEffect(() => {
    fetch("/docs-index.json")
      .then(res => res.json())
      .then(data => {
        setIndex(data);
        const fuseInstance = new Fuse(data, {
          keys: ["title", "content", "category"],
          includeMatches: true,
          threshold: 0.3,
        });
        setFuse(fuseInstance);
      })
      .catch(err => console.error("Failed to load search index:", err));
  }, []);

  // Perform search
  useEffect(() => {
    if (!fuse) return;
    if (!query) {
      setResults([]);
      return;
    }
    const searchResults = fuse.search(query);
    setResults(searchResults.slice(0, 8)); // Top 8 results
    setSelectedIndex(0);
  }, [query, fuse]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results.length > 0 && results[selectedIndex]) {
          router.push(results[selectedIndex].item.href);
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, router, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4 sm:px-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-full max-w-2xl bg-[#0a0a0a] border border-[#00d4ff]/20 rounded-xl shadow-2xl overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center px-4 py-3 border-b border-[#00d4ff]/10">
              <svg className="w-5 h-5 text-[#00d4ff] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
              </svg>
              <input
                ref={inputRef}
                className="flex-1 bg-transparent text-white font-mono-code placeholder:text-gray-600 focus:outline-none"
                placeholder="Search documentation..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <span className="font-mono-code text-[10px] text-gray-500 border border-gray-700 px-1.5 py-0.5 rounded ml-2">ESC</span>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto">
              {query && results.length === 0 && (
                <div className="px-6 py-12 text-center text-gray-500 font-mono-code text-sm">
                  No results found for <span className="text-[#00d4ff]">"{query}"</span>
                </div>
              )}
              {!query && (
                <div className="px-6 py-8 text-center text-gray-600 font-mono-code text-sm flex flex-col gap-2">
                  <span>Try searching for...</span>
                  <div className="flex justify-center gap-2 mt-2">
                    <span className="px-2 py-1 bg-[#00d4ff]/10 text-[#00d4ff] rounded text-xs cursor-pointer hover:bg-[#00d4ff]/20" onClick={() => setQuery("CRDT")}>CRDT</span>
                    <span className="px-2 py-1 bg-[#00ff41]/10 text-[#00ff41] rounded text-xs cursor-pointer hover:bg-[#00ff41]/20" onClick={() => setQuery("WASM Modules")}>WASM Modules</span>
                    <span className="px-2 py-1 bg-[#ff7a2f]/10 text-[#ff7a2f] rounded text-xs cursor-pointer hover:bg-[#ff7a2f]/20" onClick={() => setQuery("state_set")}>qos_sdk::state_set</span>
                  </div>
                </div>
              )}
              {results.length > 0 && (
                <ul className="p-2 space-y-1">
                  {results.map((result, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <li key={result.item.href}>
                        <button
                          className={`w-full text-left flex flex-col gap-1 px-4 py-3 rounded-lg transition-colors ${
                            isSelected ? "bg-[#00d4ff]/10 border border-[#00d4ff]/30" : "hover:bg-white/5 border border-transparent"
                          }`}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          onClick={() => {
                            router.push(result.item.href);
                            onClose();
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white font-mono-code">{result.item.title}</span>
                            <span className="text-[10px] uppercase tracking-widest text-[#00d4ff] font-mono-code">{result.item.category}</span>
                          </div>
                          <span className="text-xs text-gray-400 line-clamp-1">{result.item.content || result.item.href}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="px-4 py-2 bg-black border-t border-gray-900 flex items-center justify-between text-[10px] text-gray-600 font-mono-code">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><kbd className="bg-gray-800 px-1 rounded">↑</kbd> <kbd className="bg-gray-800 px-1 rounded">↓</kbd> to navigate</span>
                <span className="flex items-center gap-1"><kbd className="bg-gray-800 px-1 rounded">↵</kbd> to select</span>
              </div>
              <span>Powered by Fuse.js</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
