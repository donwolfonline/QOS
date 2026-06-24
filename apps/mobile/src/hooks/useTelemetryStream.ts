import { useEffect, useRef } from 'react';
import { useConnectionStore } from '../store/useConnectionStore';
import { useTelemetryStore } from '../store/useTelemetryStore';

export const useTelemetryStream = () => {
  const { hostIp, port, authToken, isConnected } = useConnectionStore();
  const appendLog = useTelemetryStore((state) => state.appendLog);
  const setMetrics = useTelemetryStore((state) => state.setMetrics);
  const updatePeer = useTelemetryStore((state) => state.updatePeer);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isConnected || !hostIp || !port || !authToken) return;

    const url = `ws://${hostIp}:${port}/api/v1/stream`;
    
    // In React Native, the native WebSocket allows custom headers
    const ws = new WebSocket(url, undefined, {
      headers: {
        'X-QOS-API-KEY': authToken
      }
    });

    ws.onopen = () => {
      console.log('[Telemetry] Stream connected');
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (typeof parsed !== 'object' || parsed === null) return;
        
        const data = parsed as Record<string, unknown>;
        const logId = Math.random().toString(36).substring(2, 9);
        
        appendLog({
          id: logId,
          level: (data.level as string) || 'INFO',
          timestamp: new Date().toISOString(),
          target: (data.target as string) || 'unknown',
          fields: data.fields ? (data.fields as Record<string, unknown>) : data,
        });

        // Heuristics for metrics based on daemon NDJSON formats
        const target = data.target as string | undefined;
        const fields = data.fields as Record<string, unknown> | undefined;
        
        // 1. Peer Discovery
        if (target === 'qos_state_sync::engine' && typeof fields?.message === 'string' && fields.message.includes('Discovered new peer')) {
          const peerId = (fields.peer_id as string) || `peer-${Math.random().toString(36).substring(2, 6)}`;
          updatePeer(peerId, true);
        }

        if (target === 'qos_state_sync::engine' && typeof fields?.message === 'string' && fields.message.includes('Peer disconnected')) {
          const peerId = fields.peer_id as string | undefined;
          if (peerId) updatePeer(peerId, false);
        }

        // 2. Execution metrics
        if (target === 'qos_runtime::context' && fields?.message === 'Invocation finished') {
          setMetrics(
            (fields.fuel_consumed as number) || 0,
            (fields.peak_memory_bytes as number) || 0
          );
        }
      } catch (e) {
        // Ignore parsing errors for raw text logs
      }
    };

    ws.onerror = (e) => {
      console.error('[Telemetry] Stream error', e);
    };

    ws.onclose = () => {
      console.log('[Telemetry] Stream disconnected');
    };

    wsRef.current = ws;

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [isConnected, hostIp, port, authToken]);
};
