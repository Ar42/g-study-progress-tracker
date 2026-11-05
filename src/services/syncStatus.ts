import { create } from "zustand";

interface SyncState {
  /** Writes queued or in flight. */
  readonly pending: number;
  /** Epoch ms of the last write start/finish — used to ignore stale reads. */
  readonly lastWriteAt: number;
  readonly lastSyncedAt: number;
  readonly lastError: string | null;
  readonly beginWrite: () => void;
  readonly endWrite: (error?: string) => void;
  readonly markSynced: () => void;
}

export const useSyncStatus = create<SyncState>((set) => ({
  pending: 0,
  lastWriteAt: 0,
  lastSyncedAt: 0,
  lastError: null,
  beginWrite: () => set((s) => ({ pending: s.pending + 1, lastWriteAt: Date.now() })),
  endWrite: (error) =>
    set((s) => ({
      pending: Math.max(0, s.pending - 1),
      lastWriteAt: Date.now(),
      lastError: error ?? (s.pending - 1 > 0 ? s.lastError : null),
    })),
  markSynced: () => set({ lastSyncedAt: Date.now() }),
}));
