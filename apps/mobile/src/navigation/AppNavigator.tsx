import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../theme';
import { useAppStore } from '../store/useAppStore';

import { SetupScreen } from '../screens/SetupScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ExecuteScannerScreen } from '../screens/ExecuteScannerScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { EdgeExplorerScreen } from '../screens/EdgeExplorerScreen';

const Tab = createBottomTabNavigator();

export const AppNavigator = () => {
  const isConnected = useAppStore(state => state.isConnected);

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.accent,
        },
        fonts: {} as any,
      }}
    >
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.primary,
          tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textMuted,
        }}
      >
        {!isConnected ? (
          <Tab.Screen name="Setup" component={SetupScreen} options={{ title: 'Init Node' }} />
        ) : (
          <>
            <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Telemetry' }} />
            <Tab.Screen name="Scanner" component={ExecuteScannerScreen} options={{ title: 'Scan Payload' }} />
            <Tab.Screen name="State" component={EdgeExplorerScreen} options={{ title: 'Edge State' }} />
            <Tab.Screen name="Library" component={LibraryScreen} options={{ title: 'Local Bundles' }} />
          </>
        )}
      </Tab.Navigator>
    </NavigationContainer>
  );
};
