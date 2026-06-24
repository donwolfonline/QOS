"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConnectionStore } from 'qos-ui-shared';

// Simulated Restaurant layout: 8 tables
const RESTAURANT_TABLES = [1, 2, 3, 4, 5, 6, 7, 8];

export default function AdminDashboardPage() {
  const { edgeState, hostIp, port, authToken, updateEdgeState } = useConnectionStore();
  const [transactions, setTransactions] = useState<{id: string, time: string, message: string, level: string}[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom behavior
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transactions]);

  // WebSocket Connection for Live Data
  useEffect(() => {
    if (!hostIp || !port || !authToken) return;

    const url = `ws://${hostIp}:${port}/api/v1/stream`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'AUTH', token: authToken }));
      setTransactions(prev => [...prev, {
        id: Math.floor(Math.random() * 1000000).toString(16).toUpperCase(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        message: 'SYSTEM ONLINE: Awaiting edge telemetry...',
        level: 'info'
      }].slice(-50)); // keep last 50
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Update Edge State & Format Business Events
        if (parsed.type === 'STATE_MUTATION' && typeof parsed.key === 'string' && parsed.value !== undefined) {
          updateEdgeState(parsed.key, parsed.value);
          
          let businessMsg = `State Mutation: ${parsed.key} updated`;
          let level = 'info';

          if (parsed.key === 'guestbook_log' && Array.isArray(parsed.value) && parsed.value.length > 0) {
            const lastEntry = parsed.value[parsed.value.length - 1];
            const name = lastEntry?.user || lastEntry?.user_name || lastEntry?.name || 'Unknown Guest';
            const tableNum = (parsed.value.length <= 8) ? parsed.value.length : (parsed.value.length % 8) || 8;
            businessMsg = `Table ${tableNum} Check-in: ${name}`;
            level = 'success';
          }

          setTransactions(prev => [...prev, {
            id: Math.floor(Math.random() * 1000000).toString(16).toUpperCase(),
            time,
            message: businessMsg,
            level
          }].slice(-50));
        }

        // Execution events
        const target = parsed.target || (parsed.fields && parsed.fields.target);
        if (target === 'qos_runtime::context') {
          const msg = parsed.message || (parsed.fields && parsed.fields.message);
          
          let businessMsg = `Module Triggered: ${msg}`;
          let level = 'info';

          if (msg === 'Invocation finished') {
            const fuel = parsed.fields?.fuel_consumed || 0;
            businessMsg = `Payload executed. Cost: ${fuel}ms`;
            level = 'success';
          } else if (msg && msg.toLowerCase().includes('error') || msg.toLowerCase().includes('fail')) {
            level = 'error';
          }

          setTransactions(prev => [...prev, {
            id: Math.floor(Math.random() * 1000000).toString(16).toUpperCase(),
            time,
            message: businessMsg,
            level
          }].slice(-50));
        }
        // System Broadcast logic
        if (parsed.type === 'SYSTEM_BROADCAST' || parsed.msg_type === 'SYSTEM_BROADCAST') {
          let level = 'info';
          if (parsed.level === 'WARNING') level = 'error';
          if (parsed.level === 'OFFER') level = 'success';
          
          setTransactions(prev => [...prev, {
            id: Math.floor(Math.random() * 1000000).toString(16).toUpperCase(),
            time,
            message: `[BROADCAST] ${parsed.message}`,
            level
          }].slice(-50));
        }
      } catch {
        // ignore parse error
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [hostIp, port, authToken, updateEdgeState]);

  // Global Override State
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastLevel, setBroadcastLevel] = useState('INFO');
  const [isTransmitting, setIsTransmitting] = useState(false);

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim() || isTransmitting || !hostIp || !port || !authToken) return;
    setIsTransmitting(true);
    
    try {
      await fetch(`http://${hostIp}:${port}/api/v1/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-qos-api-key': authToken || ''
        },
        body: JSON.stringify({
          level: broadcastLevel,
          message: broadcastMessage.trim()
        })
      });
      setBroadcastMessage('');
    } catch (e) {
      console.error('Failed to send broadcast', e);
    }
    
    setTimeout(() => {
      setIsTransmitting(false);
    }, 3000);
  };

  // Map guestbook_log to tables if needed, or rely on table_* keys
  const getTableData = (tableId: number) => {
    // Check direct table key
    const directTable = edgeState[`table_${tableId}`];
    if (directTable) return directTable;

    // Check if a guestbook entry is assigned to this table
    const guestbook = edgeState['guestbook_log'];
    if (Array.isArray(guestbook)) {
      const guest = guestbook[tableId - 1];
      if (guest) return guest;
    }
    
    return null;
  };

  const getLevelColor = (level: string) => {
    if (level === 'WARNING') return '#ff003c';
    if (level === 'OFFER') return '#00ff41';
    return '#00d4ff';
  };

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] p-4 lg:p-6 grid gap-4 lg:grid-cols-12 lg:grid-rows-12 font-sans text-gray-200 overflow-hidden select-none">
      
      {/* Header Bar */}
      <div className="lg:col-span-12 lg:row-span-1 flex items-center justify-between border border-[#00d4ff]/20 rounded-xl px-6 bg-[#121212] shadow-[0_0_15px_rgba(0,212,255,0.05)] relative overflow-hidden">
        {/* Subtle glowing top line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent opacity-50" />
        
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 rounded border border-[#00d4ff]/50 flex items-center justify-center shadow-[0_0_10px_rgba(0,212,255,0.2)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <h1 className="text-xl font-bold font-mono tracking-widest text-[#00d4ff] uppercase hidden sm:block">
            Admin // Command Center
          </h1>
        </div>

        <div className="flex items-center space-x-6 text-xs font-mono">
          <div className="flex flex-col items-end opacity-80">
            <span className="uppercase tracking-widest text-[#00d4ff]">Edge Node</span>
            <span className="text-gray-400">{hostIp || '127.0.0.1'}:{port || '3000'}</span>
          </div>
          <div className="flex items-center space-x-2 border border-[#00d4ff]/30 px-3 py-1.5 rounded-full bg-[#00d4ff]/10">
            <span className="uppercase tracking-widest text-[#00d4ff] font-bold">Online</span>
            <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse shadow-[0_0_8px_#00d4ff]" />
          </div>
        </div>
      </div>

      {/* Live Floor Plan (Center/Left) */}
      <div className="lg:col-span-8 lg:row-span-9 border border-[#00d4ff]/30 rounded-xl bg-[#0a0a0a] p-4 shadow-[0_0_15px_rgba(0,212,255,0.1)] relative flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-widest text-[#00d4ff] opacity-80 font-mono font-bold flex items-center">
            <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Live Floor Plan
          </h2>
          <span className="text-[10px] font-mono border border-[#00d4ff]/20 px-2 py-1 rounded text-[#00d4ff] opacity-70">
            SECTOR: ALPHA
          </span>
        </div>
        
        {/* Physical Tables Grid */}
        <div className="flex-1 w-full bg-[#050505] rounded-lg p-6 relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(0,212,255,0.5) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          
          <div className="relative z-10 w-full h-full grid grid-cols-4 grid-rows-2 gap-6">
            {RESTAURANT_TABLES.map((tableId) => {
              const data = getTableData(tableId);
              const isOccupied = !!data;
              const guestName = data?.user || data?.user_name || data?.name || 'UNKNOWN';
              const timestamp = data?.timestamp ? new Date(Number(data.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

              return (
                <motion.div
                  layoutId={`table-${tableId}`}
                  key={`table-${tableId}`}
                  initial={false}
                  animate={{
                    borderColor: isOccupied ? '#00ff41' : 'rgba(255, 255, 255, 0.1)',
                    backgroundColor: isOccupied ? 'rgba(0, 255, 65, 0.05)' : '#0a0a0a',
                    boxShadow: isOccupied ? '0 0 20px rgba(0, 255, 65, 0.2)' : '0 0 0px rgba(0,0,0,0)'
                  }}
                  transition={{ duration: 0.5 }}
                  className="rounded-xl border-2 flex flex-col justify-between p-4 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-xl font-black font-mono opacity-20 ${isOccupied ? 'text-[#00ff41]' : 'text-gray-500'}`}>
                      {tableId.toString().padStart(2, '0')}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-[#00ff41] animate-pulse shadow-[0_0_8px_#00ff41]' : 'bg-gray-600'}`} />
                  </div>

                  <AnimatePresence mode="popLayout">
                    {isOccupied ? (
                      <motion.div
                        key="occupied"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col"
                      >
                        <span className="text-[#00ff41] font-bold text-lg tracking-wide uppercase truncate">
                          {guestName}
                        </span>
                        <span className="text-[#00ff41]/70 font-mono text-xs">
                          CK-IN: {timestamp}
                        </span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col"
                      >
                        <span className="text-gray-500 font-mono text-sm tracking-widest uppercase">
                          EMPTY
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Global Override Console (Top Right) */}
      <div className="lg:col-span-4 lg:row-span-3 border border-dashed rounded-xl bg-[#0a0a0a] p-4 flex flex-col transition-colors duration-300 relative overflow-hidden"
           style={{ borderColor: `${getLevelColor(broadcastLevel)}40` }}>
        <h2 className="text-xs uppercase tracking-widest opacity-80 mb-3 font-mono font-bold flex items-center"
            style={{ color: getLevelColor(broadcastLevel) }}>
          <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          Global Override Console
        </h2>

        <div className="flex space-x-2 mb-2">
          <select 
            value={broadcastLevel}
            onChange={(e) => setBroadcastLevel(e.target.value)}
            disabled={isTransmitting}
            className="bg-[#121212] border rounded px-2 py-1 text-xs font-mono font-bold uppercase cursor-pointer focus:outline-none transition-colors"
            style={{ borderColor: `${getLevelColor(broadcastLevel)}50`, color: getLevelColor(broadcastLevel) }}
          >
            <option value="INFO">INFO</option>
            <option value="OFFER">OFFER</option>
            <option value="WARNING">WARNING</option>
          </select>

          <div className="flex-1 border rounded bg-[#050505] flex items-center px-2 transition-colors relative"
               style={{ borderColor: `${getLevelColor(broadcastLevel)}30` }}>
            <span className="text-gray-500 font-mono text-xs mr-2 animate-pulse">&gt;</span>
            <input 
              type="text" 
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBroadcast()}
              disabled={isTransmitting}
              placeholder="Broadcast message..."
              className="bg-transparent border-none w-full text-xs font-mono text-gray-200 focus:outline-none placeholder-gray-600 disabled:opacity-50"
            />
          </div>
        </div>

        <button 
          onClick={handleBroadcast}
          disabled={!broadcastMessage.trim() || isTransmitting}
          className="w-full mt-auto py-2 rounded text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            backgroundColor: `${getLevelColor(broadcastLevel)}20`, 
            color: getLevelColor(broadcastLevel),
            border: `1px solid ${getLevelColor(broadcastLevel)}50`,
            boxShadow: isTransmitting ? `0 0 15px ${getLevelColor(broadcastLevel)}40` : 'none'
          }}
        >
          {isTransmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>TRANSMITTING...</span>
            </>
          ) : (
            <span>BROADCAST</span>
          )}
        </button>

        {/* Scanline overlay */}
        {isTransmitting && (
          <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="w-full h-2 bg-white/50 blur-sm animate-scanline" />
          </div>
        )}
      </div>

      {/* Transaction Feed (Middle Right) */}
      <div className="lg:col-span-4 lg:row-span-6 border border-[#00d4ff]/20 rounded-xl bg-[#0a0a0a] p-4 shadow-[0_0_10px_rgba(0,212,255,0.05)] flex flex-col">
        <h2 className="text-xs uppercase tracking-widest text-[#00d4ff] opacity-80 mb-4 font-mono font-bold flex items-center">
          <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Live Transaction Feed
        </h2>
        
        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2 flex flex-col" style={{ fontFamily: '"Fira Code", monospace' }}>
          <AnimatePresence initial={false}>
            {transactions.map((tx) => {
              const colorClass = tx.level === 'error' ? 'text-[#ff003c]' : tx.level === 'success' ? 'text-[#00ff41]' : 'text-gray-300';
              const borderClass = tx.level === 'error' ? 'border-[#ff003c]/30 border-l-2' : tx.level === 'success' ? 'border-[#00ff41]/30 border-l-2' : 'border-[#00d4ff]/10';
              const bgClass = tx.level === 'error' ? 'bg-[#ff003c]/5' : tx.level === 'success' ? 'bg-[#00ff41]/5' : 'bg-[#121212]';

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={tx.id} 
                  className={`p-3 border rounded ${borderClass} ${bgClass} transition-colors flex flex-col space-y-1`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] opacity-70">
                      {tx.time} {"//"} 0x{tx.id}
                    </span>
                  </div>
                  <div className={`text-xs tracking-wide ${colorClass} break-words`}>
                    {tx.message}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={feedEndRef} />
        </div>
      </div>

      {/* System Modes / Module Manager (Bottom) */}
      <div className="lg:col-span-12 lg:row-span-2 border border-[#00d4ff]/20 rounded-xl bg-[#121212] p-4 shadow-[0_0_10px_rgba(0,212,255,0.05)] flex items-center justify-between overflow-x-auto">
        <div className="flex flex-col mr-8">
          <h2 className="text-xs uppercase tracking-widest text-[#00d4ff] opacity-80 font-mono font-bold whitespace-nowrap mb-1">
            System Modes // Module Manager
          </h2>
          <span className="text-[10px] text-gray-500 font-mono">Select active edge logic module</span>
        </div>

        <div className="flex space-x-4 flex-1 justify-around max-w-4xl">
          {['tactical_guestbook', 'happy_hour_menu', 'vip_checkout'].map((mod) => {
            // Check edge state. If undefined, default to tactical_guestbook
            const activeModule = edgeState['ACTIVE_LOGIC_MODULE'] || 'tactical_guestbook';
            const isActive = activeModule === mod;
            
            return (
              <button
                key={mod}
                onClick={async () => {
                  if (!hostIp || !port || !authToken) {
                    console.warn("Cannot change module: Not connected to an Edge Node.");
                    return;
                  }
                  
                  try {
                    // Update state locally for fast UI response
                    updateEdgeState('ACTIVE_LOGIC_MODULE', mod);
                    
                    // Fire API request to Edge Node
                    await fetch(`http://${hostIp}:${port}/api/v1/state/edit`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-qos-api-key': authToken || ''
                      },
                      body: JSON.stringify({
                        namespace: 'system',
                        key: 'ACTIVE_LOGIC_MODULE',
                        action: 'put',
                        value: btoa(mod)
                      })
                    });
                  } catch (e) {
                    console.error('Failed to set system mode', e);
                  }
                }}
                className={`flex flex-col items-center justify-center space-y-2 px-6 py-2 rounded-lg border transition-all group min-w-[140px] relative overflow-hidden ${
                  isActive 
                    ? 'border-[#00ff41]/50 bg-[#00ff41]/10 shadow-[0_0_15px_rgba(0,255,65,0.15)]' 
                    : 'border-transparent hover:border-[#00d4ff]/30 hover:bg-[#00d4ff]/5'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-t from-[#00ff41]/20 to-transparent opacity-50" />
                )}
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center bg-[#0a0a0a] group-hover:scale-110 transition-transform relative z-10 ${
                  isActive ? 'border-[#00ff41] shadow-[0_0_10px_rgba(0,255,65,0.4)]' : 'border-[#00d4ff]/50 shadow-[0_0_10px_rgba(0,212,255,0.2)]'
                }`}>
                  <svg className={`w-5 h-5 ${isActive ? 'text-[#00ff41]' : 'text-[#00d4ff]'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className={`text-[10px] uppercase font-mono tracking-wider relative z-10 ${
                  isActive ? 'text-[#00ff41] font-bold' : 'text-[#00d4ff] opacity-80'
                }`}>
                  {mod.replace('_', ' ')}
                </span>
                {isActive && (
                  <span className="absolute top-1 right-2 text-[8px] font-mono text-[#00ff41] animate-pulse">ACTIVE</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 212, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 212, 255, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 212, 255, 0.4);
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
