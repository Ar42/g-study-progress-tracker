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
  /**
   * Why the script's version is unknown:
   * "unreachable" = the configured URL didn't answer with JSON (wrong/old deployment URL);
   * "outdated"    = it answered, but it's a script without the read endpoint.
   */
  readonly scriptIssue: "unreachable" | "outdated" | null;
  readonly beginWrite: () => void;
  readonly endWrite: (error?: string) => void;
  readonly markSynced: () => void;
  readonly setScriptVersion: (v: number) => void;
  readonly setScriptIssue: (issue: "unreachable" | "outdated") => void;
}

export const useSyncStatus = create<SyncState>((set) => ({
  pending: 0,
  lastWriteAt: 0,
  lastSyncedAt: 0,
  lastError: null,
  scriptVersion: null,
  scriptIssue: null,
  beginWrite: () => set((s) => ({ pending: s.pending + 1, lastWriteAt: Date.now() })),
  endWrite: (error) =>
    set((s) => ({
      pending: Math.max(0, s.pending - 1),
      lastWriteAt: Date.now(),
      lastError: error ?? (s.pending - 1 > 0 ? s.lastError : null),
    })),
  markSynced: () => set({ lastSyncedAt: Date.now() }),
  setScriptVersion: (v) => set((s) => (s.scriptVersion === v && s.scriptIssue === null ? s : { scriptVersion: v, scriptIssue: null })),
  // Only matters while the version is still unknown; a later successful read clears it.
  setScriptIssue: (issue) => set((s) => (s.scriptVersion !== null || s.scriptIssue === issue ? s : { scriptIssue: issue })),
}));
