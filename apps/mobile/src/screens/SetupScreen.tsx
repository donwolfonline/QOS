import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { theme } from '../theme';
import { ConnectionService } from '../services/connection';
import * as Linking from 'expo-linking';

export const SetupScreen = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const device = useCameraDevice('back');

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleScan = async (url: string) => {
    if (isConnecting) return;
    
    setIsScanning(false);
    setIsConnecting(true);

    try {
      const parsed = Linking.parse(url);
      if (parsed.scheme === 'qos' && parsed.hostname) {
        const ip = parsed.hostname;
        const port = parsed.port ? parseInt(parsed.port, 10) : 3000;
        const token = parsed.queryParams?.token as string;

        if (ip && token) {
          const success = await ConnectionService.verifyAndConnect(ip, port, token);
          if (!success) {
            alert('Connection Refused: Invalid Token or Node Offline');
          }
        }
      } else {
        alert('Invalid QR Format. Must be a valid qos:// URI.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsConnecting(false);
    }
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && codes[0].value) {
        handleScan(codes[0].value);
      }
    }
  });

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.subtitle}>Camera access required to scan node QR.</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.subtitle}>No camera device found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>[ AWAITING CONNECTION ]</Text>
      
      <View style={styles.scannerWrapper}>
        {isScanning ? (
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            codeScanner={codeScanner}
          />
        ) : (
          <View style={styles.placeholder}>
            {isConnecting ? (
              <>
                <ActivityIndicator size="large" color={theme.colors.accent} />
                <Text style={styles.subtitle}>HANDSHAKING...</Text>
              </>
            ) : (
              <Text style={styles.subtitle}>Scan Daemon QR to Initialize</Text>
            )}
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => setIsScanning(!isScanning)}
        disabled={isConnecting}
      >
        <Text style={styles.buttonText}>
          {isScanning ? 'CANCEL SCAN' : 'START CAMERA'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.lg,
    ...theme.effects.neonGlow,
    marginBottom: theme.spacing.lg,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    marginTop: theme.spacing.sm,
  },
  scannerWrapper: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    marginBottom: theme.spacing.xl,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: 4,
  },
  buttonText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.md,
    ...theme.effects.neonGlow,
  }
});
