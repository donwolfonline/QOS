import { create } from 'zustand';

interface Peer {
  id: string;
  multiaddr?: string;
}

interface AppState {
  // Connection
  nodeIp: string | null;
  authToken: string | null;
  isConnected: boolean;
  
  // Telemetry & State
  peers: Peer[];
  activeKeys: string[];
  metrics: {
    cpu: number;
    memoryPeakBytes: number;
  };
  
  // Actions
  setCredentials: (ip: string, token: string) => void;
  setConnectionStatus: (status: boolean) => void;
  updateTelemetry: (data: any) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  nodeIp: null,
  authToken: null,
  isConnected: false,
  
  peers: [],
  activeKeys: [],
  metrics: { cpu: 0, memoryPeakBytes: 0 },

  setCredentials: (ip, token) => set({ nodeIp: ip, authToken: token }),
  setConnectionStatus: (status) => set({ isConnected: status }),
  
  updateTelemetry: (data) => set((state) => {
    // Basic structural update - will expand based on actual ndjson shape
    return { ...state }; 
  }),

  reset: () => set({
    nodeIp: null,
    authToken: null,
    isConnected: false,
    peers: [],
    activeKeys: [],
    metrics: { cpu: 0, memoryPeakBytes: 0 },
  }),
}));
