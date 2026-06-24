import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { ConnectionService } from '../services/connection';

export const useDeepLink = () => {
  useEffect(() => {
    // Handle link if app was closed
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Handle link if app was running in background
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async (url: string) => {
    try {
      // Expected format: qos://<ip>:<port>?token=<token>
      // e.g. qos://192.168.1.5:3000?token=1234-abcd
      
      const parsed = Linking.parse(url);
      if (parsed.scheme === 'qos' && parsed.hostname) {
        const ip = parsed.hostname;
        const port = parsed.port ? parseInt(parsed.port, 10) : 3000;
        const token = parsed.queryParams?.token as string;

        if (ip && token) {
          console.log(`Intercepted Deep Link! Attempting handshake with ${ip}:${port}...`);
          const success = await ConnectionService.verifyAndConnect(ip, port, token);
          if (success) {
            console.log('Deep link handshake successful!');
          } else {
            console.error('Deep link handshake failed: Invalid credentials or host unreachable.');
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse deep link:', e);
    }
  };
};
