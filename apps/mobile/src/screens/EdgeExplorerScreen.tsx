import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../theme';
import { useConnectionStore } from '../store/useConnectionStore';
import { useTelemetryStore } from '../store/useTelemetryStore';
import { EdgeStateModal } from '../components/EdgeStateModal';

interface StateEntry {
  namespace: string;
  key: string;
  vector_clock: Record<string, number>;
  last_modified: number;
  bytes_base64: string;
}

type DiffStatus = 'added' | 'changed' | 'removed' | 'unchanged';

interface DiffEntry extends StateEntry {
  status: DiffStatus;
  compoundKey: string;
  // Formatted VC for display
  vcSummary: string;
}

export const EdgeExplorerScreen = () => {
  const { hostIp, authToken, isConnected } = useConnectionStore();
  const latestLog = useTelemetryStore(state => state.logs[0]);
  
  const [data, setData] = useState<DiffEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const previousStateRef = useRef<Map<string, StateEntry>>(new Map());

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<DiffEntry | null>(null);

  const fetchDump = useCallback(async () => {
    if (!hostIp || !authToken || !isConnected) return;
    
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`http://${hostIp}:3000/api/v1/state/dump?page=0&limit=100`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const rawEntries: StateEntry[] = await res.json();
      
      const newMap = new Map<string, StateEntry>();
      const diffEntries: DiffEntry[] = [];
      
      // Calculate Added, Changed, Unchanged
      for (const entry of rawEntries) {
        const compKey = `${entry.namespace}::${entry.key}`;
        newMap.set(compKey, entry);
        
        const prev = previousStateRef.current.get(compKey);
        let status: DiffStatus = 'unchanged';
        
        if (!prev) {
          status = 'added';
        } else if (prev.last_modified !== entry.last_modified || JSON.stringify(prev.vector_clock) !== JSON.stringify(entry.vector_clock)) {
          status = 'changed';
        }
        
        // Summarize vector clock for display: "NodeA:2, NodeB:1"
        const vcSummary = Object.entries(entry.vector_clock)
          .map(([k, v]) => `${k.slice(0, 8)}:${v}`)
          .join(', ');
        
        diffEntries.push({ ...entry, status, compoundKey: compKey, vcSummary });
      }
      
      // Check for removed
      for (const [compKey, prevEntry] of previousStateRef.current.entries()) {
        if (!newMap.has(compKey)) {
          diffEntries.push({ ...prevEntry, status: 'removed', compoundKey: compKey, vcSummary: '' });
        }
      }
      
      // Sort: added/changed first, then alphabetical
      diffEntries.sort((a, b) => {
        if (a.status !== 'unchanged' && b.status === 'unchanged') return -1;
        if (a.status === 'unchanged' && b.status !== 'unchanged') return 1;
        return a.compoundKey.localeCompare(b.compoundKey);
      });

      setData(diffEntries);
      
      // Update refs
      // We don't want to keep "removed" items in the previous map for the next cycle
      previousStateRef.current = newMap;
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(String(err));
      }
    } finally {
      setLoading(false);
    }
  }, [hostIp, authToken, isConnected]);

  // Initial fetch
  useEffect(() => {
    fetchDump();
  }, [fetchDump]);

  useEffect(() => {
    if (
      latestLog?.target === 'qos_state_sync::engine' && 
      typeof latestLog.fields.message === 'string' &&
      latestLog.fields.message.includes('Applying remote CRDT delta')
    ) {
      // Small delay to ensure DB write flushed
      setTimeout(fetchDump, 100);
    }
  }, [latestLog, fetchDump]);

  const handleEdit = (item: DiffEntry) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: DiffEntry }) => {
    let color = theme.colors.text;
    let glow = {};
    if (item.status === 'added') {
      color = theme.colors.primary;
      glow = theme.effects.neonGlow;
    } else if (item.status === 'changed') {
      color = theme.colors.accent;
      glow = theme.effects.neonGlowAccent;
    } else if (item.status === 'removed') {
      color = theme.colors.error;
      glow = theme.effects.neonGlowError;
    }

    return (
      <TouchableOpacity 
        style={[styles.row, item.status === 'removed' && styles.rowRemoved]} 
        onPress={() => item.status !== 'removed' && handleEdit(item)}
        disabled={item.status === 'removed'}
      >
        <View style={styles.rowHeader}>
          <Text style={[styles.statusText, { color, ...glow }]}>
            [{item.status.toUpperCase()}]
          </Text>
          <Text style={styles.versionText}>ts:{item.last_modified}</Text>
        </View>
        <Text style={styles.keyText} numberOfLines={1}>
          {item.namespace} / <Text style={styles.keyHighlight}>{item.key}</Text>
        </Text>
        <Text style={styles.vcText} numberOfLines={1}>
          VC: {item.vcSummary || '∅'}
        </Text>
        <Text style={styles.valueText} numberOfLines={2}>
          {item.bytes_base64}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>STATE_DUMP</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchDump}>
          {loading ? <ActivityIndicator color={theme.colors.primary} size="small" /> : <Text style={styles.refreshText}>SYNC</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addText}>+ INJECT</Text>
        </TouchableOpacity>
      </View>
      
      {errorMsg ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      <FlatList
        data={data}
        keyExtractor={item => item.compoundKey}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No state keys found in the mesh.</Text>}
      />

      <EdgeStateModal 
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          fetchDump();
        }}
        initialNamespace={editingItem?.namespace}
        initialKey={editingItem?.key}
        initialValueBase64={editingItem?.bytes_base64}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    flex: 1,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.md,
    ...theme.effects.neonGlow,
  },
  refreshButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
  },
  refreshText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.sm,
  },
  addButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    backgroundColor: theme.colors.primary,
  },
  addText: {
    color: theme.colors.background,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.sm,
    fontWeight: 'bold',
  },
  errorBox: {
    margin: theme.spacing.md,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.error,
    backgroundColor: 'rgba(255, 0, 60, 0.1)',
  },
  errorText: {
    color: theme.colors.error,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.sm,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  row: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  rowRemoved: {
    opacity: 0.5,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  statusText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.xs,
    fontWeight: 'bold',
  },
  versionText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.xs,
  },
  keyText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.sm,
    marginBottom: theme.spacing.xs,
  },
  keyHighlight: {
    color: theme.colors.text,
  },
  valueText: {
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.xs,
    opacity: 0.8,
  }
});
