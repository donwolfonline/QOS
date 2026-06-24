import { useAppStore } from '../store/useAppStore';

let ws: WebSocket | null = null;

export const connectTelemetry = (ip: string, token: string) => {
  if (ws) {
    ws.close();
  }

  const url = `ws://${ip}:3000/api/v1/stream`;
  ws = new WebSocket(url, undefined, {
    headers: {
      'X-QOS-API-KEY': token
    }
  });

  ws.onopen = () => {
    useAppStore.getState().setConnectionStatus(true);
    console.log('Connected to Q-OS Telemetry Stream');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      useAppStore.getState().updateTelemetry(data);
    } catch (e) {
      console.error('Failed to parse telemetry message', e);
    }
  };

  ws.onclose = () => {
    useAppStore.getState().setConnectionStatus(false);
    console.log('Disconnected from Q-OS Telemetry Stream');
  };

  ws.onerror = (e) => {
    console.error('WebSocket Error:', e);
    ws?.close();
  };
};

export const disconnectTelemetry = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
};

export const executePayload = async (ip: string, token: string, payload: Uint8Array): Promise<any> => {
  const url = `http://${ip}:3000/api/v1/execute`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-QOS-API-KEY': token,
      'Content-Type': 'application/octet-stream',
    },
    body: payload,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Execute failed (${response.status}): ${errText}`);
  }

  return response.json();
};
