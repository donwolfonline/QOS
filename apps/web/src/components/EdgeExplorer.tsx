'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import { Search, RefreshCw, Edit3, Trash2, X, Check } from 'lucide-react';

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
  compKey: string;
  vcSummary: string;
}

const API_BASE = process.env.NEXT_PUBLIC_QOS_API_URL ?? 'http://127.0.0.1:3000';

const STATUS_STYLE: Record<DiffStatus, { label: string; cls: string }> = {
  added:     { label: 'ADD', cls: 'text-qos-primary border-qos-primary/50 bg-qos-primary/5' },
  changed:   { label: 'CHG', cls: 'text-qos-accent border-qos-accent/50 bg-qos-accent/5'   },
  removed:   { label: 'DEL', cls: 'text-qos-danger border-qos-danger/50 bg-qos-danger/5'   },
  unchanged: { label: '---', cls: 'text-qos-muted border-transparent'                       },
};

export function EdgeExplorer() {
  const [entries, setEntries] = useState<DiffEntry[]>([]);
  const [prevMap, setPrevMap] = useState<Map<string, StateEntry>>(new Map());
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<DiffEntry | null>(null);
  const [editValue, setEditValue] = useState('');

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/state/dump`, {
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw: StateEntry[] = await res.json();

      const newMap = new Map<string, StateEntry>();
      const diff: DiffEntry[] = raw.map((e) => {
        const ck = `${e.namespace}::${e.key}`;
        newMap.set(ck, e);
        const prev = prevMap.get(ck);
        let status: DiffStatus = 'unchanged';
        if (!prev) status = 'added';
        else if (
          prev.last_modified !== e.last_modified ||
          JSON.stringify(prev.vector_clock) !== JSON.stringify(e.vector_clock)
        ) status = 'changed';

        const vcSummary = Object.entries(e.vector_clock)
          .map(([k, v]) => `${k.slice(0, 8)}:${v}`)
          .join(', ');
        return { ...e, status, compKey: ck, vcSummary };
      });

      // Mark deletions
      prevMap.forEach((_, ck) => {
        if (!newMap.has(ck)) {
          const [namespace, key] = ck.split('::');
          diff.push({
            namespace, key, vector_clock: {}, last_modified: 0, bytes_base64: '',
            status: 'removed', compKey: ck, vcSummary: '',
          });
        }
      });

      setEntries(diff);
      setPrevMap(newMap);
    } catch {
      /* silently fail – daemon may be down */
    } finally {
      setLoading(false);
    }
  }, [prevMap]);

  useEffect(() => { fetchEntries(); }, []);

  const handleDelete = async (entry: DiffEntry) => {
    await fetch(`${API_BASE}/api/v1/state/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
      body: JSON.stringify({ namespace: entry.namespace, key: entry.key, action: 'delete' }),
    });
    fetchEntries();
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    await fetch(`${API_BASE}/api/v1/state/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
      body: JSON.stringify({
        namespace: editTarget.namespace,
        key: editTarget.key,
        action: 'put',
        value: btoa(editValue),
      }),
    });
    setEditTarget(null);
    fetchEntries();
  };

  const filtered = entries.filter(
    (e) =>
      e.key.toLowerCase().includes(query.toLowerCase()) ||
      e.namespace.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <section aria-label="Edge Explorer">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-mono text-[10px] text-qos-muted uppercase tracking-widest">// EDGE STATE EXPLORER</span>
        <div className="flex-1 h-px bg-qos-border" />
      </div>

      <div className="bg-qos-surface border border-qos-border rounded-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-qos-border bg-black/30">
          <Search size={13} className="text-qos-muted shrink-0" />
          <input
            id="edge-explorer-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="filter keys…"
            className="flex-1 bg-transparent font-mono text-xs text-qos-text placeholder:text-qos-muted outline-none"
          />
          <button
            id="edge-explorer-refresh"
            onClick={fetchEntries}
            disabled={loading}
            className="text-qos-muted hover:text-qos-primary transition-colors"
          >
            <RefreshCw size={13} className={clsx(loading && 'animate-spin')} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-y-auto max-h-[22rem] font-mono text-xs">
          {filtered.length === 0 && (
            <div className="text-qos-muted text-center py-8 opacity-50">
              {loading ? 'Scanning state store…' : 'No entries match'}
            </div>
          )}
          {filtered.map((e) => {
            const s = STATUS_STYLE[e.status];
            return (
              <div
                key={e.compKey}
                className="grid grid-cols-[3.5rem_1fr_auto] gap-x-3 p-2 border-b border-qos-border/50 hover:bg-white/5 transition-colors group"
              >
                <span className={clsx('border rounded-sm px-1 text-[10px] text-center leading-5', s.cls)}>
                  {s.label}
                </span>
                <div className="overflow-hidden">
                  <div className="truncate">
                    <span className="text-qos-muted">{e.namespace}/</span>
                    <span className="text-qos-text">{e.key}</span>
                  </div>
                  <div className="text-qos-accent opacity-60 truncate">VC: {e.vcSummary || '∅'}</div>
                  <div className="text-qos-muted opacity-50 truncate">{e.bytes_base64.slice(0, 40)}</div>
                </div>
                <div className="flex items-start gap-2 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditTarget(e); setEditValue(atob(e.bytes_base64 || '')); }}
                    className="text-qos-accent hover:text-qos-primary transition-colors"
                    aria-label={`Edit ${e.key}`}
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(e)}
                    className="text-qos-muted hover:text-qos-danger transition-colors"
                    aria-label={`Delete ${e.key}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative bg-qos-surface border border-qos-primary/40 rounded-sm shadow-[0_0_40px_rgba(0,255,65,0.15)] w-full max-w-md mx-4 p-5">
            {/* Corner accents */}
            <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-qos-primary opacity-60" />
            <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-qos-primary opacity-60" />

            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs text-qos-primary uppercase tracking-widest">// EDIT STATE</span>
              <button onClick={() => setEditTarget(null)} className="text-qos-muted hover:text-qos-text">
                <X size={14} />
              </button>
            </div>
            <p className="font-mono text-xs text-qos-muted mb-3">
              {editTarget.namespace}/{editTarget.key}
            </p>
            <textarea
              id="edge-explorer-edit-value"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={4}
              className="w-full bg-black/60 border border-qos-border rounded-sm p-2 font-mono text-xs text-qos-text outline-none focus:border-qos-primary transition-colors resize-none"
            />
            <div className="flex gap-2 mt-3 justify-end">
              <button
                onClick={() => setEditTarget(null)}
                className="font-mono text-xs px-3 py-1.5 border border-qos-border text-qos-muted hover:text-qos-text rounded-sm transition-colors"
              >
                CANCEL
              </button>
              <button
                id="edge-explorer-save"
                onClick={handleEdit}
                className="font-mono text-xs px-3 py-1.5 border border-qos-primary/50 text-qos-primary bg-qos-primary/10 hover:bg-qos-primary/20 rounded-sm transition-colors flex items-center gap-1.5"
              >
                <Check size={12} />
                COMMIT
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
