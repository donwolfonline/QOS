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
export declare const useConnectionStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ConnectionState>>;
export {};
