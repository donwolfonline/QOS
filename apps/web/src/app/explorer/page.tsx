"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeonContainer, useConnectionStore } from 'qos-ui-shared';

// Defined types to aid rendering safely
interface GuestbookEntry {
  user?: string;
  user_name?: string;
  name?: string;
  timestamp?: number | string;
  node_id?: string;
}

const highlightNDJSON = (jsonString: string) => {
  return jsonString.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match) {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          // Key
          return `<span style="color: #00d4ff;">${match.slice(0, -1)}</span>:`;
        } else {
          // String value
          return `<span style="color: #00ff41;">${match}</span>`;
        }
      }
      return match;
    }
  );
};

export default function EdgeExplorerPage() {
  const { edgeState, hostIp, port, authToken, isConnected } = useConnectionStore();
  const [rawLogs, setRawLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Safely extract the guestbook array. Fallback to empty array to avoid crashes.
  const rawLog = edgeState['guestbook_log'];
  const guestbookLog: GuestbookEntry[] = Array.isArray(rawLog) ? rawLog : [];

  // WebSocket connection for telemetry
  useEffect(() => {
    if (!hostIp || !port || !authToken) return;

    const url = `ws://${hostIp}:${port}/api/v1/stream`;
    
    // Attempting to connect with Auth Token
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      // Typically need to send auth as first message if browser WebSocket doesn't support headers
      ws.send(JSON.stringify({ type: 'AUTH', token: authToken }));
      setRawLogs(prev => [...prev, `{"system": "connected", "endpoint": "${url}"}`]);
    };

    ws.onmessage = (event) => {
      setRawLogs(prev => {
        const newLogs = [...prev, event.data as string];
        // Keep last 100 logs to prevent memory leak
        if (newLogs.length > 100) return newLogs.slice(newLogs.length - 100);
        return newLogs;
      });

      // Update Zustand state if it's a STATE_MUTATION (to mimic mobile stream behavior)
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'STATE_MUTATION' && typeof parsed.key === 'string' && parsed.value !== undefined) {
          useConnectionStore.getState().updateEdgeState(parsed.key, parsed.value);
        }
      } catch (e) {}
    };

    ws.onerror = (e) => {
      setRawLogs(prev => [...prev, `{"system": "error", "message": "Connection error"}`]);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [hostIp, port, authToken]);

  // Auto-scroll
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rawLogs]);

  return (
    <div className="min-h-screen bg-black text-[#00ff41] p-8" style={{ fontFamily: 'FiraCode_400Regular, "Fira Code", monospace' }}>
      <h1 className="text-3xl font-bold mb-6 tracking-widest uppercase border-b border-[#00ff41] pb-2 max-w-[1600px] mx-auto">
        &gt;_ Q-OS Edge Telemetry
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[1600px] mx-auto">
        
        {/* Edge Explorer Table */}
        <NeonContainer color="#00ff41" glowIntensity={2} style={{ padding: 32, backgroundColor: 'rgba(0, 255, 65, 0.05)' }}>
          <h2 className="text-xl font-bold mb-4 tracking-widest uppercase">
            &gt;_ Active State: guestbook_log
          </h2>
          
          <div className="mb-4 text-sm opacity-80">
            <p>STATUS: INTERCEPTING NODE TELEMETRY</p>
            <p>TARGET MODULE: TACTICAL_GUESTBOOK</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#00ff41] border-opacity-50 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Guest Name</th>
                  <th className="py-3 px-4">Check-in Timestamp</th>
                  <th className="py-3 px-4">Processing Node ID</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {guestbookLog.length === 0 ? (
                    <motion.tr 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                    >
                      <td colSpan={3} className="py-8 text-center animate-pulse opacity-50">
                        AWAITING INCOMING DECRYPTED DATA...
                      </td>
                    </motion.tr>
                  ) : (
                    guestbookLog.map((entry, index) => {
                      const guestName = entry.user || entry.user_name || entry.name || 'UNKNOWN_ENTITY';
                      const uniqueKey = `${guestName}-${entry.timestamp}-${index}`;
                      
                      return (
                        <motion.tr
                          key={uniqueKey}
                          initial={{ 
                            x: -50, 
                            opacity: 0, 
                            backgroundColor: '#00ff41',
                            color: '#000000',
                            textShadow: '0 0 10px #00ff41'
                          }}
                          animate={{ 
                            x: 0, 
                            opacity: 1, 
                            backgroundColor: 'transparent',
                            color: '#00ff41',
                            textShadow: 'none'
                          }}
                          transition={{ 
                            duration: 1.5, 
                            ease: "easeOut" 
                          }}
                          className="border-b border-[#00ff41] border-opacity-20"
                        >
                          <td className="py-3 px-4 font-bold">{guestName}</td>
                          <td className="py-3 px-4 font-mono">
                            {entry.timestamp ? new Date(Number(entry.timestamp)).toLocaleString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4 font-mono opacity-80 text-sm">
                            {entry.node_id || 'EDGE_NODE_UNKNOWN'}
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </NeonContainer>

        {/* Raw Memory Inspector */}
        {/* Raw Memory Inspector */}
        <NeonContainer color="#00d4ff" glowIntensity={2} style={{ padding: 32, height: '100%', maxHeight: 800, display: 'flex', flexDirection: 'column' }}>
          <h2 className="text-xl font-bold mb-4 tracking-widest uppercase text-[#00d4ff]">
            &gt;_ Raw Memory Inspector
          </h2>
          <div className="mb-4 text-sm opacity-80 text-[#00d4ff]">
            <p>STREAM: wss://{hostIp || 'UNCONNECTED'}:{port || '0'}/api/v1/stream</p>
            <p>FORMAT: NDJSON</p>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-[#050505] p-4 rounded border border-[#00d4ff] border-opacity-30 custom-scrollbar">
            {rawLogs.length === 0 ? (
              <div className="text-center opacity-50 animate-pulse mt-10 text-[#00d4ff]">
                AWAITING MEMORY STREAM...
              </div>
            ) : (
              rawLogs.map((log, i) => (
                <div 
                  key={i} 
                  className="mb-2 text-sm leading-relaxed break-all"
                  dangerouslySetInnerHTML={{ __html: highlightNDJSON(log) }}
                />
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </NeonContainer>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 212, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 212, 255, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 212, 255, 0.8);
        }
      `}} />
    </div>
  );
}
