'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { NeonContainer } from 'qos-ui-shared';

function ScanlineOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 mix-blend-overlay"
      style={{
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0,255,65,0.015) 2px,
          rgba(0,255,65,0.015) 4px
        )`,
      }}
    />
  );
}

const PHRASES = [
  "Zero-Latency Edge Execution.",
  "Serverless Physical Infrastructure.",
  "Real-time CRDT Synchronization."
];

function Typewriter() {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

  useEffect(() => {
    if (subIndex === PHRASES[index].length + 1 && !reverse) {
      const timeout = setTimeout(() => setReverse(true), 2500);
      return () => clearTimeout(timeout);
    }
    if (subIndex === 0 && reverse) {
      const timeout = setTimeout(() => {
        setReverse(false);
        setIndex((prev) => (prev + 1) % PHRASES.length);
      }, 0);
      return () => clearTimeout(timeout);
    }

    const speed = reverse ? 30 : 80;
    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, speed + Math.random() * 50);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse]);

  return (
    <div className="h-10 mt-6 flex justify-center items-center">
      <span className="font-mono text-[#00d4ff] text-lg md:text-2xl font-bold tracking-widest drop-shadow-[0_0_10px_rgba(0,212,255,0.4)]">
        &gt; {PHRASES[index].substring(0, subIndex)}
        <span className="animate-pulse opacity-80 inline-block w-2.5 h-6 bg-[#00d4ff] ml-1 align-middle" />
      </span>
    </div>
  );
}

function InteractiveTerminal() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const sequence = [
      1000, // Show cmd 1
      1200, // Show output 1
      800,  // Show output 2
      1200, // Show cmd 2
      1000, // Show output 3
      1500  // Show output 4
    ];
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    
    let delay = 0;
    sequence.forEach((time, index) => {
      delay += time;
      const t = setTimeout(() => {
        setStep(index + 1);
      }, delay);
      timeouts.push(t);
    });
    
    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="w-full max-w-3xl mx-auto mt-32 mb-16"
    >
      <div className="rounded-xl bg-[#050505] border border-[#00d4ff]/30 shadow-[0_0_30px_rgba(0,212,255,0.1)] overflow-hidden relative">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(0,212,255,0.5) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        {/* Window Header */}
        <div className="bg-[#121212] px-4 py-3 border-b border-[#00d4ff]/20 flex items-center relative z-10">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#ff003c]/80 border border-[#ff003c]" />
            <div className="w-3 h-3 rounded-full bg-[#facc15]/80 border border-[#facc15]" />
            <div className="w-3 h-3 rounded-full bg-[#00ff41]/80 border border-[#00ff41]" />
          </div>
          <div className="mx-auto text-xs font-mono text-[#00d4ff]/60 tracking-widest uppercase">
            root@qos-edge-01:~
          </div>
        </div>
        
        {/* Terminal Body */}
        <div className="p-6 font-mono text-sm md:text-base leading-relaxed min-h-[250px] text-left relative z-10">
           {step >= 1 && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-1">
               <span className="text-[#00d4ff] mr-2">$</span>
               <span className="text-white font-bold">curl -sL https://q-os.io/install | bash</span>
             </motion.div>
           )}
           {step >= 2 && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <span className="text-gray-500 mr-2">&gt;</span>
               <span className="text-[#00ff41] font-bold mr-2">[OK]</span>
               <span className="text-gray-300">Downloading Rust Binary...</span>
             </motion.div>
           )}
           {step >= 3 && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <span className="text-gray-500 mr-2">&gt;</span>
               <span className="text-[#00ff41] font-bold mr-2">[OK]</span>
               <span className="text-gray-300">Initializing Sled State Store...</span>
             </motion.div>
           )}
           {step >= 4 && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 mb-1">
               <span className="text-[#00d4ff] mr-2">$</span>
               <span className="text-white font-bold">qos start</span>
             </motion.div>
           )}
           {step >= 5 && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <span className="text-gray-500 mr-2">&gt;</span>
               <span className="text-[#00d4ff] font-bold mr-2">[MESH]</span>
               <span className="text-gray-300">mDNS Discovery Active. Found 3 Peers.</span>
             </motion.div>
           )}
           {step >= 6 && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <span className="text-gray-500 mr-2">&gt;</span>
               <span className="text-[#facc15] font-bold mr-2">[WASM]</span>
               <span className="text-[#00ff41]">Ready for payload injection.</span>
             </motion.div>
           )}
           <div className="mt-2 flex items-center">
             <span className="text-[#00d4ff] mr-2">$</span> 
             {(step === 0 || step === 3 || step >= 6) && (
               <span className="w-2.5 h-5 bg-[#00ff41] animate-pulse inline-block" />
             )}
           </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      <ScanlineOverlay />
      
      {/* Background radial gradient glow */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] bg-[#00d4ff] opacity-[0.03] blur-[150px] rounded-full" />
      </div>

      <main className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl mx-auto w-full">
        
        {/* Entrance animations for Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          {/* Top minimal badge */}
          <div className="mb-8 border border-[#00d4ff]/30 px-4 py-1.5 rounded-full bg-[#00d4ff]/10 inline-flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff41] animate-pulse shadow-[0_0_8px_#00ff41]" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#00d4ff] font-bold">
              v0.1.0-alpha Live
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] leading-tight">
            Q-OS:<br/>
            <span className="text-4xl md:text-6xl lg:text-7xl text-gray-400">THE SPATIAL COMPUTE PROTOCOL</span>
          </h1>

          <Typewriter />
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 w-full"
        >
          <button className="group relative px-8 py-4 bg-[#00ff41] text-[#0a0a0a] font-mono font-black text-sm uppercase tracking-widest rounded transition-all hover:bg-[#00ff41]/90 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,65,0.4)] w-full sm:w-auto">
            DEPLOY NODE (macOS/Linux)
            {/* Minimal terminal prompt artifact on hover */}
            <span className="absolute -top-3 -right-3 bg-[#0a0a0a] text-[#00ff41] text-[10px] px-2 py-1 border border-[#00ff41]/30 opacity-0 group-hover:opacity-100 transition-opacity">
              curl -sL qos.sh | bash
            </span>
          </button>
          
          <Link href="/admin/dashboard" className="w-full sm:w-auto">
            <button className="px-8 py-4 bg-transparent border-2 border-[#00d4ff] text-[#00d4ff] font-mono font-bold text-sm uppercase tracking-widest rounded transition-all hover:bg-[#00d4ff]/10 hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] w-full sm:w-auto">
              ENTER COMMAND CENTER
            </button>
          </Link>
        </motion.div>

        {/* Footer specs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="mt-32 grid grid-cols-3 gap-8 border-t border-gray-800 pt-8 w-full max-w-3xl"
        >
          <div className="flex flex-col items-center">
            <span className="text-[#00d4ff] font-mono text-2xl font-black">&lt; 2ms</span>
            <span className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-1">Cold Start</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[#00ff41] font-mono text-2xl font-black">WASM</span>
            <span className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-1">Sandboxed Exec</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-white font-mono text-2xl font-black">Local-First</span>
            <span className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-1">Sled K/V DB</span>
          </div>
        </motion.div>

        {/* Interactive Terminal Component */}
        <InteractiveTerminal />

        {/* System Architecture Bento-Grid */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1 }}
          className="mt-32 w-full max-w-6xl pb-24"
        >
          <h2 className="text-3xl font-black font-mono tracking-widest uppercase text-center mb-16 text-[#00d4ff] drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">
            System Architecture
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Card 1: Rust Edge Node */}
            <motion.div whileHover={{ y: -8, filter: 'brightness(1.2)' }} transition={{ type: 'spring', stiffness: 300 }}>
              <NeonContainer color="#ff003c" glowIntensity={3} style={{ height: '100%', minHeight: 300 }}>
                <div className="flex flex-col h-full text-left">
                  <div className="mb-6 flex justify-center items-center h-32 relative">
                    <svg className="w-20 h-20 text-[#ff003c] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <div className="absolute w-24 h-24 border border-[#ff003c]/30 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                  </div>
                  <h3 className="text-xl font-mono font-bold text-[#ff003c] mb-2 uppercase">Rust Edge Node</h3>
                  <p className="text-sm font-mono text-gray-400 leading-relaxed">
                    A hyper-optimized, zero-server dependency execution engine. Compiles to native binaries to run WebAssembly sandbox modules locally on the physical floor.
                  </p>
                </div>
              </NeonContainer>
            </motion.div>

            {/* Card 2: Real-Time Admin HUD */}
            <motion.div whileHover={{ y: -8, filter: 'brightness(1.2)' }} transition={{ type: 'spring', stiffness: 300 }}>
              <NeonContainer color="#00d4ff" glowIntensity={3} style={{ height: '100%', minHeight: 300 }}>
                <div className="flex flex-col h-full text-left">
                  <div className="mb-6 flex justify-center items-center h-32 w-full">
                    <div className="grid grid-cols-2 gap-2 w-full px-4">
                      <div className="h-8 border border-[#00d4ff] bg-[#00d4ff]/10 rounded shadow-[0_0_8px_rgba(0,212,255,0.4)]" />
                      <div className="h-8 border border-[#00d4ff]/30 bg-transparent rounded" />
                      <div className="h-8 border border-[#00d4ff]/30 bg-transparent rounded" />
                      <div className="h-8 border border-[#00ff41] bg-[#00ff41]/10 rounded shadow-[0_0_8px_rgba(0,255,65,0.4)]" />
                    </div>
                  </div>
                  <h3 className="text-xl font-mono font-bold text-[#00d4ff] mb-2 uppercase">Real-Time Admin HUD</h3>
                  <p className="text-sm font-mono text-gray-400 leading-relaxed">
                    Live Floor Plan powered by WebSockets and CRDT state synchronization. Monitor physical table activity and broadcast global overrides instantly.
                  </p>
                </div>
              </NeonContainer>
            </motion.div>

            {/* Card 3: Zero-Friction Micro-UIs */}
            <motion.div whileHover={{ y: -8, filter: 'brightness(1.2)' }} transition={{ type: 'spring', stiffness: 300 }}>
              <NeonContainer color="#00ff41" glowIntensity={3} style={{ height: '100%', minHeight: 300 }}>
                <div className="flex flex-col h-full text-left">
                  <div className="mb-6 flex justify-center items-center h-32 relative">
                     <div className="w-16 h-16 border-2 border-[#00ff41] border-dashed rounded flex items-center justify-center animate-spin" style={{ animationDuration: '4s' }}>
                       <div className="w-8 h-8 bg-[#00ff41]/20 rounded-sm" />
                     </div>
                     <svg className="w-6 h-6 text-[#00ff41] absolute" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                     </svg>
                  </div>
                  <h3 className="text-xl font-mono font-bold text-[#00ff41] mb-2 uppercase">Zero-Friction Micro-Frontends</h3>
                  <p className="text-sm font-mono text-gray-400 leading-relaxed">
                    Guests download nothing. Scan a static physical QR code and dynamically route to the active WASM logic module. Instant execution overhead.
                  </p>
                </div>
              </NeonContainer>
            </motion.div>

          </div>
        </motion.div>
      </main>
    </div>
  );
}
