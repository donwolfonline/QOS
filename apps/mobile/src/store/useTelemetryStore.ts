import { create } from 'zustand';

export interface LogEntry {
  id: string;
  level: string;
  timestamp: string;
  target: string;
  fields: Record<string, unknown>;
}

export interface PeerNode {
  id: string;
  isActive: boolean;
}

interface TelemetryState {
  logs: LogEntry[];
  peers: PeerNode[];
  cpuFuel: number;
  peakMemoryBytes: number;
  
  appendLog: (log: LogEntry) => void;
  updatePeer: (id: string, isActive: boolean) => void;
  setMetrics: (cpu: number, mem: number) => void;
  clearTelemetry: () => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  logs: [],
  peers: [],
  cpuFuel: 0,
  peakMemoryBytes: 0,

  appendLog: (log) => set((state) => {
    const newLogs = [log, ...state.logs].slice(0, 200);
    return { logs: newLogs };
  }),

  updatePeer: (id, isActive) => set((state) => {
    const exists = state.peers.find(p => p.id === id);
    if (exists) {
      return { peers: state.peers.map(p => p.id === id ? { ...p, isActive } : p) };
    }
    return { peers: [...state.peers, { id, isActive }] };
  }),

  setMetrics: (cpu, mem) => set({ cpuFuel: cpu, peakMemoryBytes: mem }),
  
  clearTelemetry: () => set({ logs: [], peers: [], cpuFuel: 0, peakMemoryBytes: 0 }),
}));
