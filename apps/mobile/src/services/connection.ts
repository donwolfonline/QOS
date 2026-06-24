import * as SecureStore from 'expo-secure-store';
import { useConnectionStore } from '../store/useConnectionStore';

const SECURE_STORE_KEY = 'QOS_CONNECTION_PARAMS';

export const ConnectionService = {
  /**
   * Attempts an initial handshake with the backend to verify the API Key.
   * We do this by hitting POST /api/v1/execute with an empty payload.
   * If Auth is valid, it returns 400 Bad Request ("Empty payload provided").
   * If Auth is invalid, it returns 401 Unauthorized.
   */
  verifyAndConnect: async (ip: string, port: number, token: string): Promise<boolean> => {
    try {
      const url = `http://${ip}:${port}/api/v1/execute`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-QOS-API-KEY': token,
          'Content-Type': 'application/octet-stream',
        },
        body: new Uint8Array([]),
      });

      // 400 means the endpoint was successfully reached and Auth passed,
      // but the payload was empty (which is exactly what we sent).
      if (response.status === 400 || response.ok) {
        useConnectionStore.getState().setConnectionParams(ip, port, token);
        useConnectionStore.getState().setConnected(true);
        
        // Persist securely
        await SecureStore.setItemAsync(SECURE_STORE_KEY, JSON.stringify({ ip, port, token }));
        return true;
      }
      
      console.warn('Connection failed with status:', response.status);
      return false;
    } catch (e) {
      console.error('Connection handshake failed:', e);
      return false;
    }
  },

  /**
   * Loads persisted credentials from Secure Store on startup.
   */
  loadPersistedConnection: async (): Promise<boolean> => {
    try {
      const data = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      if (data) {
        const { ip, port, token } = JSON.parse(data);
        // Automatically attempt to reconnect
        return await ConnectionService.verifyAndConnect(ip, port, token);
      }
    } catch (e) {
      console.error('Failed to load persisted connection:', e);
    }
    return false;
  },

  /**
   * Disconnects and wipes persisted credentials.
   */
  disconnect: async () => {
    useConnectionStore.getState().clearConnection();
    await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
  },

  /**
   * Sends the trigger payload (e.g., qos-exec://...) to the Q-OS runtime.
   */
  executePayload: async (payload: string): Promise<any> => {
    const state = useConnectionStore.getState();
    if (!state.ip || !state.port || !state.token) {
      throw new Error("Not connected to a QOS node");
    }

    const url = `http://${state.ip}:${state.port}/api/v1/execute`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-QOS-API-KEY': state.token,
        'Content-Type': 'text/plain',
      },
      body: payload,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Execution failed (${response.status}): ${errText}`);
    }

    return await response.json();
  }
};
