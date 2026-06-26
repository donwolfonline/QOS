"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useConnectionStore = void 0;
const zustand_1 = require("zustand");
exports.useConnectionStore = (0, zustand_1.create)((set) => ({
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
