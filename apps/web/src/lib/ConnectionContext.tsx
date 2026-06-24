'use client';
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  ConnectionService,
  ConnectionStatus,
  QosFrame,
  TelemetryFrame,
  connectionService,
} from '@/lib/ConnectionService';

interface ConnectionState {
  status: ConnectionStatus;
  nodeId: string | null;
  meshId: string | null;
  metrics: Record<string, number>;
  logs: Array<{ id: string; ts: number; level: string; target: string; message: string }>;
}

interface ConnectionCtx extends ConnectionState {
  service: ConnectionService;
  reconnect: () => void;
}

const Ctx = createContext<ConnectionCtx | null>(null);

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConnectionState>({
    status: 'connecting',
    nodeId: null,
    meshId: null,
    metrics: {},
    logs: [],
  });

  const reconnect = useCallback(() => {
    connectionService.disconnect();
    setTimeout(() => connectionService.connect(), 100);
  }, []);

  useEffect(() => {
    const unsubStatus = connectionService.on('status', (status) =>
      setState((s) => ({ ...s, status })),
    );

    const unsubFrame = connectionService.on('frame', (frame: QosFrame) => {
      if (frame.type === 'telemetry') {
        const tf = frame as TelemetryFrame;
        setState((s) => ({
          ...s,
          nodeId: tf.node_id,
          meshId: tf.mesh_id,
          metrics: { ...s.metrics, ...tf.metrics },
          logs: [
            ...s.logs.slice(-199), // cap at 200
            ...tf.logs.map((l, i) => ({
              id: `${tf.ts}-${i}`,
              ts: tf.ts,
              level: l.level,
              target: l.target,
              message: l.message,
            })),
          ],
        }));
      }
    });

    connectionService.connect();

    return () => {
      unsubStatus();
      unsubFrame();
      connectionService.disconnect();
    };
  }, []);

  return (
    <Ctx.Provider value={{ ...state, service: connectionService, reconnect }}>
      {children}
    </Ctx.Provider>
  );
}

export function useConnection() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useConnection must be used inside <ConnectionProvider>');
  return ctx;
}
