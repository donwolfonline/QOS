import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../theme';
import { useConnectionStore } from '../store/useConnectionStore';
import base64 from 'base-64';

interface EdgeStateModalProps {
  visible: boolean;
  onClose: () => void;
  initialNamespace?: string;
  initialKey?: string;
  initialValueBase64?: string;
}

export const EdgeStateModal: React.FC<EdgeStateModalProps> = ({
  visible,
  onClose,
  initialNamespace,
  initialKey,
  initialValueBase64,
}) => {
  const { hostIp, authToken } = useConnectionStore();
  const [namespace, setNamespace] = useState('');
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setNamespace(initialNamespace || '');
      setKey(initialKey || '');
      
      // Attempt to decode base64 to string for easy editing
      if (initialValueBase64) {
        try {
          setValue(base64.decode(initialValueBase64));
        } catch (e) {
          setValue('<binary data>'); // Failed to decode as UTF8
        }
      } else {
        setValue('');
      }
    }
  }, [visible, initialNamespace, initialKey, initialValueBase64]);

  const handleSubmit = async (action: 'put' | 'delete') => {
    if (!hostIp || !authToken) return;
    setIsSubmitting(true);

    try {
      let b64Value = '';
      if (action === 'put') {
        b64Value = base64.encode(value);
      }

      const res = await fetch(`http://${hostIp}:3000/api/v1/state/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          namespace,
          key,
          action,
          value: b64Value
        })
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        Alert.alert('Mutation Failed', err.message);
      } else {
        Alert.alert('Mutation Failed', String(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>[ EDGE STATE EDITOR ]</Text>

          <Text style={styles.label}>NAMESPACE</Text>
          <TextInput
            style={styles.input}
            value={namespace}
            onChangeText={setNamespace}
            placeholder="module_hash/invocation_id"
            placeholderTextColor={theme.colors.textMuted}
            editable={!initialNamespace}
          />

          <Text style={styles.label}>KEY</Text>
          <TextInput
            style={styles.input}
            value={key}
            onChangeText={setKey}
            placeholder="Key name"
            placeholderTextColor={theme.colors.textMuted}
            editable={!initialKey}
          />

          <Text style={styles.label}>VALUE (UTF-8)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={value}
            onChangeText={setValue}
            multiline
            placeholder="Value to encode"
            placeholderTextColor={theme.colors.textMuted}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={() => handleSubmit('delete')}
              disabled={isSubmitting}
            >
              <Text style={styles.deleteButtonText}>DELETE</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={() => handleSubmit('put')}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'MUTATING...' : 'WRITE'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose} disabled={isSubmitting}>
            <Text style={styles.closeButtonText}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    ...theme.effects.neonGlow,
  },
  title: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.lg,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  label: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.xs,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    backgroundColor: 'rgba(0, 255, 65, 0.05)',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  submitButtonText: {
    color: theme.colors.background,
    fontFamily: theme.typography.fontFamily,
    fontWeight: 'bold',
  },
  deleteButton: {
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.error,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: theme.colors.error,
    fontFamily: theme.typography.fontFamily,
  },
  closeButton: {
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  closeButtonText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
  }
});
