import { create } from 'zustand';

interface ConnectionState {
  hostIp: string | null;
  port: number | null;
  authToken: string | null;
  isConnected: boolean;

  setConnectionParams: (ip: string, port: number, token: string) => void;
  setConnected: (status: boolean) => void;
  clearConnection: () => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  hostIp: null,
  port: null,
  authToken: null,
  isConnected: false,

  setConnectionParams: (ip, port, token) => set({ hostIp: ip, port, authToken: token }),
  setConnected: (status) => set({ isConnected: status }),
  clearConnection: () => set({ hostIp: null, port: null, authToken: null, isConnected: false }),
}));
