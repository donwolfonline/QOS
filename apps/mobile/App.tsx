import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ConnectionService } from './src/services/connection';
import { useDeepLink } from './src/hooks/useDeepLink';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import * as Updates from 'expo-updates';
import { theme } from './src/theme';
import { useFonts, FiraCode_400Regular } from '@expo-google-fonts/fira-code';
import { ScanlineOverlay } from 'qos-ui-shared';
import { ConnectionPulse } from './src/components/ConnectionPulse';
import { ReconnectionOverlay } from './src/components/ReconnectionOverlay';
import { ThemeProvider } from 'qos-ui-shared';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [updateReady, setUpdateReady] = useState(false);
  
  let [fontsLoaded] = useFonts({
    FiraCode_400Regular,
  });

  // Initialize deep linking interceptor
  useDeepLink();

  // Attempt to load persisted connection from Secure Store on boot
  useEffect(() => {
    const initialize = async () => {
      await ConnectionService.loadPersistedConnection();
      setIsInitializing(false);
    };
    initialize();

    const checkForUpdates = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          setUpdateReady(true);
        }
      } catch (e) {
        // Ignore errors in dev
      }
    };
    
    if (!__DEV__) {
      checkForUpdates();
    }
  }, []);

  if (isInitializing || !fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.primary, fontFamily: 'monospace' }}>[ BOOTING SYSTEM... ]</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppNavigator />
        <ScanlineOverlay />
        <ConnectionPulse />
        <ReconnectionOverlay />
        
        <Modal transparent visible={updateReady} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.neonBox}>
              <Text style={styles.neonText}>NETWORK PATCH DETECTED: Reboot interface to apply?</Text>
              <TouchableOpacity style={styles.neonButton} onPress={() => Updates.reloadAsync()}>
                <Text style={styles.neonButtonText}>[ REBOOT ]</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  neonBox: {
    borderWidth: 2,
    borderColor: '#0ff',
    backgroundColor: 'rgba(0, 255, 255, 0.05)',
    padding: 24,
    borderRadius: 4,
    shadowColor: '#0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
    alignItems: 'center',
  },
  neonText: {
    color: '#0ff',
    fontFamily: 'monospace',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: '#0ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    lineHeight: 24,
  },
  neonButton: {
    borderWidth: 1,
    borderColor: '#0ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 255, 255, 0.15)',
  },
  neonButtonText: {
    color: '#0ff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textShadowColor: '#0ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  }
});
