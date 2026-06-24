"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useConnectionStore } from 'qos-ui-shared';

export default function MobileModulePage() {
  const params = useParams();
  const defaultModuleId = params?.moduleId as string;
  const { edgeState, updateEdgeState, hostIp, port, authToken } = useConnectionStore();
  
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [feedback, setFeedback] = useState<string>('');
  
  // Execution Form State
  const [alias, setAlias] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState<{ name: string, checkInNum: number, fuel: number, execModule: string } | null>(null);

  // Cyber-Alert Interceptor State
  const [broadcastAlert, setBroadcastAlert] = useState<{ message: string, level: string } | null>(null);

  // Synthetic Ping Generator
  const playPing = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // Ignore audio API limitations
    }
  };

  // Dynamic Logic Resolution
  const activeModule = edgeState['ACTIVE_LOGIC_MODULE'] || defaultModuleId;

  // Initial State Fetch
  useEffect(() => {
    if (hostIp && port) {
      fetch(`http://${hostIp}:${port}/api/v1/state/dump`)
        .then(r => r.json())
        .then((entries: any[]) => {
          const moduleEntry = entries.find(e => e.key === 'ACTIVE_LOGIC_MODULE');
          if (moduleEntry && moduleEntry.bytes_base64) {
            updateEdgeState('ACTIVE_LOGIC_MODULE', atob(moduleEntry.bytes_base64));
          }
        })
        .catch(console.error);
    }
  }, [hostIp, port, updateEdgeState]);

  // Alert Timeout
  useEffect(() => {
    if (broadcastAlert) {
      const timer = setTimeout(() => setBroadcastAlert(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [broadcastAlert]);

  useEffect(() => {
    if (!hostIp || !port || !authToken) {
      setStatus('error');
      setFeedback('Missing connection parameters.');
      return;
    }

    const url = `ws://${hostIp}:${port}/api/v1/stream`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'AUTH', token: authToken }));
      setStatus('connected');
    };

    let latestCheckInNum = 0;
    let latestFuel = 0;

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        
        // Intercept System Broadcasts
        if (parsed.type === 'SYSTEM_BROADCAST' || parsed.msg_type === 'SYSTEM_BROADCAST') {
          setBroadcastAlert({ message: parsed.message, level: parsed.level });
          playPing();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 200]);
          }
        }

        // Listen for all state mutations dynamically
        if (parsed.type === 'STATE_MUTATION' && typeof parsed.key === 'string') {
          updateEdgeState(parsed.key, parsed.value);
          
          // Specifically extract Guestbook logic if running tactical_guestbook
          if (parsed.key === 'guestbook_log' && Array.isArray(parsed.value)) {
            latestCheckInNum = parsed.value.length;
          }
        }
        
        // Extract Fuel from invocation finished
        const target = parsed.target || (parsed.fields && parsed.fields.target);
        const message = parsed.message || (parsed.fields && parsed.fields.message);
        
        if (target === 'qos_runtime::context' || (parsed.fields && parsed.target === 'qos_runtime::context')) {
          const fields = parsed.fields || parsed;
          if (fields.message === 'Invocation finished' || message === 'Invocation finished') {
            latestFuel = fields.fuel_consumed || 0;
            
            // If processing, trigger receipt!
            setIsProcessing(prev => {
              if (prev) {
                setReceipt({
                  name: alias.trim() || 'Unknown Entity',
                  checkInNum: latestCheckInNum,
                  fuel: latestFuel,
                  execModule: activeModule
                });
                // Haptic feedback
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                  navigator.vibrate([50, 100, 50]);
                }
                return false;
              }
              return prev;
            });
          }
        }
      } catch (e) {
        // Ignore
      }
    };

    ws.onerror = () => {
      setStatus('error');
      setFeedback('Failed to connect to Edge Node.');
      setIsProcessing(false);
    };

    return () => {
      ws.close();
    };
  }, [hostIp, port, authToken, alias, activeModule, updateEdgeState]);

  const handleExecute = async () => {
    if (!alias.trim() || !hostIp || !port || !authToken) return;
    
    setIsProcessing(true);
    setFeedback('');
    setReceipt(null);

    try {
      const response = await fetch(`http://${hostIp}:${port}/api/v1/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-QOS-API-KEY': authToken
        },
        body: JSON.stringify({
          module: activeModule, // Dynamically routed module
          args: { user: alias.trim() }
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      // Fallback timeout in case telemetry fails
      setTimeout(() => {
        setIsProcessing(prev => {
          if (prev) {
            setFeedback('Payload executed, but telemetry receipt timed out.');
            return false;
          }
          return prev;
        });
      }, 5000);
      
    } catch (error) {
      setFeedback('Failed to dispatch payload.');
      setIsProcessing(false);
    }
  };

  const displayTitle = activeModule 
    ? activeModule.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : 'Unknown Module';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 flex flex-col items-center justify-center p-6 font-sans">
      <AnimatePresence mode="wait">
        {!receipt ? (
          <motion.div 
            key="input-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-md bg-[#121212] rounded-2xl shadow-2xl overflow-hidden border border-[#1e1e1e] relative"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ff41] to-transparent opacity-70" />

            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#0a0a0a] border border-[#00ff41]/30 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(0,255,65,0.15)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-2 tracking-wide font-mono">
                {displayTitle}
              </h1>
              
              <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                Welcome to the guest interface. This module runs directly on the local Edge Node.
              </p>

              <div className="w-full bg-[#0a0a0a] rounded-xl p-5 border border-[#1e1e1e] mb-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Node Connection</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400 font-mono">
                      {status === 'connecting' ? 'CONNECTING...' : status === 'connected' ? 'SECURE' : 'OFFLINE'}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-[#00ff41] animate-pulse shadow-[0_0_8px_#00ff41]' : status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 mt-2">
                  <label className="text-xs text-left text-[#00ff41] font-mono tracking-wide opacity-80 uppercase">
                    Enter your alias to interface with the Node:
                  </label>
                  <input 
                    type="text" 
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    disabled={isProcessing}
                    className="w-full bg-[#121212] border border-[#333] rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00ff41] transition-colors disabled:opacity-50"
                    placeholder="Neo..."
                  />
                </div>
                
                {feedback && !isProcessing && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="mt-4 text-sm text-[#00ff41] font-mono bg-[#00ff41]/10 px-3 py-2 rounded border border-[#00ff41]/30 text-left break-words"
                  >
                    &gt; {feedback}
                  </motion.div>
                )}
              </div>

              {isProcessing ? (
                <motion.div
                  animate={{ opacity: [1, 0.4, 1, 0.7, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="w-full py-3 px-4 bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41] rounded-lg font-mono tracking-widest text-center shadow-[0_0_15px_rgba(0,255,65,0.4)]"
                >
                  &gt;_ COMPILING PAYLOAD...
                </motion.div>
              ) : (
                <button 
                  onClick={handleExecute}
                  disabled={!alias.trim() || status !== 'connected'}
                  className="w-full py-3 px-4 bg-[#00ff41]/10 hover:bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/30 rounded-lg transition-colors font-medium tracking-wide flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Execute Action</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="digital-receipt"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 100 }}
            className="w-full max-w-md bg-[#00ff41] text-black rounded-xl p-8 shadow-[0_0_40px_rgba(0,255,65,0.3)] relative overflow-hidden"
          >
            {/* Cybernetic Receipt Pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>

              <h2 className="text-2xl font-black uppercase tracking-widest mb-1 font-mono">Verified</h2>
              <p className="text-black/70 font-mono text-sm mb-8 uppercase tracking-widest">Digital Receipt</p>

              <div className="w-full border-t-2 border-black/20 border-dashed mb-6" />

              <div className="w-full space-y-4 font-mono">
                <div className="flex justify-between items-end">
                  <span className="text-sm uppercase font-bold opacity-70">Alias</span>
                  <span className="text-lg font-black">{receipt.name}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm uppercase font-bold opacity-70">Check-in No.</span>
                  <span className="text-lg font-black">#{receipt.checkInNum > 0 ? receipt.checkInNum : '???'}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm uppercase font-bold opacity-70">CPU Cost</span>
                  <span className="text-lg font-black">{receipt.fuel} ms</span>
                </div>
              </div>

              <div className="w-full border-t-2 border-black/20 border-dashed mt-6 mb-8" />

              <button 
                onClick={() => {
                  setReceipt(null);
                  setAlias('');
                }}
                className="bg-black text-[#00ff41] px-6 py-3 rounded uppercase font-bold tracking-widest text-sm hover:bg-gray-900 transition-colors w-full"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {broadcastAlert && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50, rotateX: 45 }}
              animate={{ scale: 1, y: 0, rotateX: 0 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 100 }}
              className="relative max-w-sm w-full mx-4"
            >
               {/* Neon Toast */}
               <div className="bg-[#0a0a0a] border-2 rounded-xl p-8 shadow-2xl flex flex-col items-center text-center animate-glitch"
                    style={{ 
                      borderColor: broadcastAlert.level === 'WARNING' ? '#ff003c' : broadcastAlert.level === 'OFFER' ? '#00ff41' : '#00d4ff', 
                      boxShadow: `0 0 40px ${broadcastAlert.level === 'WARNING' ? '#ff003c' : broadcastAlert.level === 'OFFER' ? '#00ff41' : '#00d4ff'}60` 
                    }}>
                  
                  {/* Scanline overlay for the toast */}
                  <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden rounded-xl">
                    <div className="w-full h-2 bg-white/50 blur-sm animate-scanline" />
                  </div>

                  <div className="mb-4 relative z-10">
                     <svg className="w-14 h-14" 
                          style={{ color: broadcastAlert.level === 'WARNING' ? '#ff003c' : broadcastAlert.level === 'OFFER' ? '#00ff41' : '#00d4ff' }} 
                          fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-widest font-mono mb-3 relative z-10" 
                      style={{ color: broadcastAlert.level === 'WARNING' ? '#ff003c' : broadcastAlert.level === 'OFFER' ? '#00ff41' : '#00d4ff' }}>
                    SYSTEM {broadcastAlert.level}
                  </h2>
                  <p className="text-gray-100 font-mono text-base leading-relaxed relative z-10">
                    {broadcastAlert.message}
                  </p>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 text-xs text-gray-600 font-mono tracking-widest text-center">
        POWERED BY Q-OS EDGE
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes glitch {
          0% { transform: translate(0) }
          20% { transform: translate(-5px, 2px) }
          40% { transform: translate(-5px, -2px) }
          60% { transform: translate(5px, 2px) }
          80% { transform: translate(5px, -2px) }
          100% { transform: translate(0) }
        }
        .animate-glitch {
          animation: glitch 0.3s cubic-bezier(.25, .46, .45, .94) both;
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1000%); }
        }
        .animate-scanline {
          animation: scanline 2s linear infinite;
        }
      `}} />
    </div>
  );
}
