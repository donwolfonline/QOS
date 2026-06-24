import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { theme } from '../theme';
import { useConnectionStore } from '../store/useConnectionStore';
import { ConnectionService } from '../services/connection';
import { ScannerOverlay } from '../components/ScannerOverlay';
import { ExecutionHud } from '../components/ExecutionHud';
import { TransactionReceipt } from '../components/TransactionReceipt';
import { useNavigation } from '@react-navigation/native';

export const ExecuteScannerScreen = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [receiptResult, setReceiptResult] = useState<any>(null);
  const [receiptError, setReceiptError] = useState<string | undefined>(undefined);
  
  const device = useCameraDevice('back');
  const navigation = useNavigation<any>();

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleScan = async (payload: string) => {
    if (isExecuting) return;
    setIsScanning(false);
    setIsExecuting(true);

    try {
      // Simulate aesthetic hud progress delay before actual instant execution
      setTimeout(async () => {
        try {
          const result = await ConnectionService.executePayload(payload);
          setReceiptResult(result);
        } catch (e: unknown) {
          console.error('[Scanner] Execution error:', e);
          const errorMsg = e instanceof Error ? e.message : String(e);
          setReceiptError(errorMsg);
        } finally {
          setIsExecuting(false);
        }
      }, 1600); // Wait for the 1.6s HUD animation to finish
    } catch (e) {
      console.error(e);
      setIsExecuting(false);
    }
  };

  const handleDismissReceipt = () => {
    setReceiptResult(null);
    setReceiptError(undefined);
    setIsScanning(true);
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
        <Text style={styles.title}>Camera access required.</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No camera device found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>// SCAN_PAYLOAD</Text>
      
      <View style={styles.scannerWrapper}>
        {isScanning && !receiptResult && !receiptError ? (
          <>
            <Camera
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={true}
              codeScanner={codeScanner}
            />
            <ScannerOverlay />
          </>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.subtitle}>CAMERA OFFLINE</Text>
          </View>
        )}
        
        <ExecutionHud isVisible={isExecuting} />
        
        {(receiptResult || receiptError) && (
          <TransactionReceipt 
            result={receiptResult} 
            error={receiptError} 
            onDismiss={handleDismissReceipt} 
          />
        )}
      </View>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => setIsScanning(!isScanning)}
        disabled={isExecuting || receiptResult !== null || receiptError !== undefined}
      >
        <Text style={styles.buttonText}>
          {isScanning ? 'CANCEL SCAN' : 'INITIALIZE SCANNER'}
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
    color: theme.colors.accent,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.lg,
    marginBottom: theme.spacing.md,
    ...theme.effects.neonGlow,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    marginTop: theme.spacing.sm,
  },
  scannerWrapper: {
    flex: 1,
    width: '100%',
    backgroundColor: theme.colors.surface,
    position: 'relative',
    overflow: 'hidden',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.secondary,
    opacity: 0.5,
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
