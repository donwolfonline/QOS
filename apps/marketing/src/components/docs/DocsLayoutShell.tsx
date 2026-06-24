"use client";

import { useState, useEffect } from "react";
import { DocsSidebar } from "@/components/docs/Sidebar";
import { SearchModal } from "@/components/docs/SearchModal";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export function DocsLayoutShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-16 flex">
      {/* Mobile Hamburger Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#00ff41] text-black rounded-full shadow-[0_0_20px_rgba(0,255,65,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>

      {/* Desktop Sidebar (Fixed) */}
      <div className="hidden lg:flex w-64 shrink-0 border-r border-[#00d4ff]/10 fixed left-0 top-16 bottom-0 overflow-y-auto z-40">
        <DocsSidebar onOpenSearch={() => setSearchOpen(true)} />
      </div>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 bg-[#0a0a0a] border-r border-[#00d4ff]/10 z-[101] overflow-y-auto"
            >
              <DocsSidebar onOpenSearch={() => setSearchOpen(true)} />
              
              {/* Close Button inside Drawer */}
              <button 
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
                onClick={() => setSidebarOpen(false)}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 lg:ml-64 min-w-0">
        <div className="max-w-3xl mx-auto px-6 xl:px-12 py-12">
          {children}
        </div>
      </div>

      {/* Right: On-this-page (placeholder) */}
      <div className="hidden xl:block w-52 shrink-0 border-l border-[#00d4ff]/10 fixed right-0 top-16 bottom-0 py-10 px-5">
        <p className="font-mono-code text-[10px] uppercase tracking-widest text-gray-700 mb-4">On this page</p>
        <div className="flex flex-col gap-2 text-xs font-mono-code text-gray-600">
          <a href="#overview" className="hover:text-[#00d4ff] transition-colors">Overview</a>
          <a href="#prerequisites" className="hover:text-[#00d4ff] transition-colors">Prerequisites</a>
          <a href="#step-1" className="hover:text-[#00d4ff] transition-colors">Step 1 — Install</a>
          <a href="#step-2" className="hover:text-[#00d4ff] transition-colors">Step 2 — Write Module</a>
          <a href="#step-3" className="hover:text-[#00d4ff] transition-colors">Step 3 — Build &amp; Deploy</a>
          <a href="#step-4" className="hover:text-[#00d4ff] transition-colors">Step 4 — Verify</a>
          <a href="#next-steps" className="hover:text-[#00d4ff] transition-colors">Next Steps</a>
        </div>
      </div>

      <SearchModal isOpen={isSearchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
