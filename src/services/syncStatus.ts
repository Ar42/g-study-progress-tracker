import { create } from "zustand";

interface SyncState {
  /** Writes queued or in flight. */
  readonly pending: number;
  /** Epoch ms of the last write start/finish — used to ignore stale reads. */
  readonly lastWriteAt: number;
  readonly lastSyncedAt: number;
  readonly lastError: string | null;
  /** Code.gs version reported by the read endpoint (null until known). */
  readonly scriptVersion: number | null;
  readonly beginWrite: () => void;
  readonly endWrite: (error?: string) => void;
  readonly markSynced: () => void;
  readonly setScriptVersion: (v: number) => void;
}

export const useSyncStatus = create<SyncState>((set) => ({
  pending: 0,
  lastWriteAt: 0,
  lastSyncedAt: 0,
  lastError: null,
  scriptVersion: null,
  beginWrite: () => set((s) => ({ pending: s.pending + 1, lastWriteAt: Date.now() })),
  endWrite: (error) =>
    set((s) => ({
      pending: Math.max(0, s.pending - 1),
      lastWriteAt: Date.now(),
      lastError: error ?? (s.pending - 1 > 0 ? s.lastError : null),
    })),
  markSynced: () => set({ lastSyncedAt: Date.now() }),
  setScriptVersion: (v) => set((s) => (s.scriptVersion === v ? s : { scriptVersion: v })),
}));
