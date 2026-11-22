import { create } from "zustand";
import type { SheetSource } from "../config/constants";

export type ScriptIssue = "unreachable" | "outdated";

interface SourceStatus {
  readonly version: number | null;
  readonly issue: ScriptIssue | null;
}

interface SyncState {
  /** Writes queued or in flight. */
  readonly pending: number;
  /** Epoch ms of the last write start/finish — used to ignore stale reads. */
  readonly lastWriteAt: number;
  readonly lastSyncedAt: number;
  readonly lastError: string | null;
  /** Per-spreadsheet script status. */
  readonly sources: Partial<Record<SheetSource, SourceStatus>>;
  /** STUDY Code.gs version reported by the read endpoint (null until known). */
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
  readonly setScriptVersion: (v: number, source?: SheetSource) => void;
  readonly setScriptIssue: (issue: ScriptIssue, source?: SheetSource) => void;
}

export const useSyncStatus = create<SyncState>((set) => ({
  pending: 0,
  lastWriteAt: 0,
  lastSyncedAt: 0,
  lastError: null,
  scriptVersion: null,
  scriptIssue: null,
  sources: {},
  beginWrite: () => set((s) => ({ pending: s.pending + 1, lastWriteAt: Date.now() })),
  endWrite: (error) =>
    set((s) => ({
      pending: Math.max(0, s.pending - 1),
      lastWriteAt: Date.now(),
      lastError: error ?? (s.pending - 1 > 0 ? s.lastError : null),
    })),
  markSynced: () => set({ lastSyncedAt: Date.now() }),
  setScriptVersion: (v, source = "STUDY") =>
    set((s) => {
      const cur = s.sources[source];
      if (cur?.version === v && cur.issue === null) return s;
      const sources = { ...s.sources, [source]: { version: v, issue: null } };
      return source === "STUDY" ? { sources, scriptVersion: v, scriptIssue: null } : { sources };
    }),
  // Only matters while the version is still unknown; a later successful read clears it.
  setScriptIssue: (issue, source = "STUDY") =>
    set((s) => {
      const cur = s.sources[source];
      if ((cur?.version ?? null) !== null || cur?.issue === issue) return s;
      const sources = { ...s.sources, [source]: { version: null, issue } };
      return source === "STUDY" ? { sources, scriptIssue: issue } : { sources };
    }),
}));

/** Script version reported by one spreadsheet's Apps Script (null until known). */
export const useSourceScriptVersion = (source: SheetSource) => useSyncStatus((s) => s.sources[source]?.version ?? null);
