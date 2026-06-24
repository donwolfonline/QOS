import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

interface TransactionReceiptProps {
  result: {
    exit_code: number;
    fuel_consumed: number;
    peak_memory_bytes: number;
  } | null;
  error?: string;
  onDismiss: () => void;
}

export const TransactionReceipt = ({ result, error, onDismiss }: TransactionReceiptProps) => {
  if (!result && !error) return null;

  const isSuccess = result?.exit_code === 0;

  return (
    <View style={styles.container}>
      <View style={[styles.receiptBox, error || !isSuccess ? styles.errorBox : {}]}>
        <Text style={styles.header}>==========================</Text>
        <Text style={styles.title}>{error ? 'TRANSACTION FAILED' : 'TRANSACTION RECEIPT'}</Text>
        <Text style={styles.header}>==========================</Text>
        
        <View style={styles.content}>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>STATUS:</Text>
                <Text style={[styles.value, isSuccess ? styles.successText : styles.errorText]}>
                  {isSuccess ? '0x00 (SUCCESS)' : `0x${result!.exit_code.toString(16)} (ERROR)`}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>CPU FUEL:</Text>
                <Text style={styles.value}>{result!.fuel_consumed.toLocaleString()} units</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>PEAK MEM:</Text>
                <Text style={styles.value}>{(result!.peak_memory_bytes / 1024).toFixed(2)} KB</Text>
              </View>
            </>
          )}
        </View>

        <Text style={styles.header}>==========================</Text>
        
        <TouchableOpacity style={styles.button} onPress={onDismiss}>
          <Text style={styles.buttonText}>[ DISMISS ]</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    zIndex: 200,
  },
  receiptBox: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  errorBox: {
    borderColor: theme.colors.error,
  },
  header: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.lg,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  content: {
    marginVertical: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  label: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
  },
  value: {
    color: theme.colors.accent,
    fontFamily: theme.typography.fontFamily,
  },
  successText: {
    color: theme.colors.primary,
    ...theme.effects.neonGlow,
  },
  errorText: {
    color: theme.colors.error,
    fontFamily: theme.typography.fontFamily,
    ...theme.effects.neonGlowError,
  },
  button: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.md,
  }
});
