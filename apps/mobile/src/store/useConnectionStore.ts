import { create } from 'zustand';

interface ConnectionState {
  hostIp: string | null;
  port: number | null;
  authToken: string | null;
  isConnected: boolean;
  edgeState: Record<string, any>;

  setConnectionParams: (ip: string, port: number, token: string) => void;
  setConnected: (status: boolean) => void;
  clearConnection: () => void;
  updateEdgeState: (key: string, value: any) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  hostIp: null,
  port: null,
  authToken: null,
  isConnected: false,
  edgeState: {},

  setConnectionParams: (ip, port, token) => set({ hostIp: ip, port, authToken: token }),
  setConnected: (status) => set({ isConnected: status }),
  clearConnection: () => set({ hostIp: null, port: null, authToken: null, isConnected: false, edgeState: {} }),
  updateEdgeState: (key, value) => set((state) => ({
    edgeState: {
      ...state.edgeState,
      [key]: value
    }
  })),
}));
