import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ConnectionService } from './src/services/connection';
import { useDeepLink } from './src/hooks/useDeepLink';
import { View, Text } from 'react-native';
import { theme } from './src/theme';
import { useFonts, FiraCode_400Regular } from '@expo-google-fonts/fira-code';
import { ScanlineOverlay } from 'qos-ui-shared';
import { ConnectionPulse } from './src/components/ConnectionPulse';
import { ReconnectionOverlay } from './src/components/ReconnectionOverlay';
import { ThemeProvider } from 'qos-ui-shared';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  
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
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
