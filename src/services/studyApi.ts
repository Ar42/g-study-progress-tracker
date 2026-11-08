import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { REQUIRED_SCRIPT_VERSION, SHEET_NAME, TIMER_SCRIPT_VERSION, WRITE_SETTLE_MS } from "../config/constants";
import type { LinkItem, LogEntry, SessionSegment, StudyDomain, StudyRow, StudySession } from "../types";
import { readTable, writeRow } from "./sheetClient";
import { rowsFromTable, toPayload } from "./rowMapper";
import { logEntriesFromTable, toLogPayload } from "./logMapper";
import { sessionsFromTable, toSessionPayload } from "./sessionMapper";
import { settingsFromTable, type SettingKey } from "./settingsMapper";
import { useSyncStatus } from "./syncStatus";

interface ApiError {
  readonly message: string;
}

const toError = (e: unknown): ApiError => ({
  message: e instanceof Error ? e.message : "Something went wrong.",
});

interface SaveArgs {
  readonly domain: StudyDomain;
  readonly row: StudyRow;
}

interface DeleteArgs {
  readonly domain: StudyDomain;
  readonly id: string;
}

interface SwapArgs {
  readonly domain: StudyDomain;
  readonly id1: string;
  readonly id2: string;
}

export interface LogData {
  entries: LogEntry[];
  /** True when the "Study Log" tab doesn't exist yet (it's created on first save). */
  missing: boolean;
}

/** Assigned below once the API exists (keeps TypeScript inference non-circular). */
let selectCachedRows: (state: unknown, domain: StudyDomain) => StudyRow[] | undefined = () => undefined;
let selectCachedLog: (state: unknown) => LogData | undefined = () => undefined;
let selectCachedSessions: (state: unknown) => SessionsData | undefined = () => undefined;
let selectCachedSettings: (state: unknown) => SettingsData | undefined = () => undefined;

export interface SessionsData {
  sessions: StudySession[];
  missing: boolean;
}

export interface SettingsData {
  /** Raw key -> value, as stored in the "Settings" tab (plus optimistic edits). */
  values: Record<string, string>;
  /** Keys that have a row in the sheet (decides UPDATE vs CREATE). */
  existingKeys: string[];
  missing: boolean;
}

/** Timer + targets need Code.gs v3 (new tabs, appended columns). */
function assertTimerWritable(): void {
  const v = useSyncStatus.getState().scriptVersion ?? 0;
  if (v < TIMER_SCRIPT_VERSION) {
    throw new Error("Update Code.gs in Apps Script to use the study timer and targets, then try again.");
  }
}

/** A CREATE that fails with "already exists" means an earlier attempt already saved it. */
const alreadyExists = (e: unknown) => e instanceof Error && /already exists/i.test(e.message);

type MutableSession = StudySession & { segments: SessionSegment[] };

/**
 * True when a write happened while (or just before) a read was in flight:
 * that snapshot may be older than what's on screen, so keep local state.
 */
/**
 * Study Log writes need Code.gs v2: v1 only writes BCS/IT columns, so it would
 * leave a log row with just its Id. Refuse instead of writing a broken row.
 */
function assertLogWritable(): void {
  const v = useSyncStatus.getState().scriptVersion ?? 0;
  if (v < REQUIRED_SCRIPT_VERSION) {
    throw new Error("Update Code.gs in Apps Script (see the notice on the Study Log page), then try again.");
  }
}

function readIsStale(startedAt: number): boolean {
  const { pending, lastWriteAt } = useSyncStatus.getState();
  return pending > 0 || lastWriteAt >= startedAt || Date.now() - lastWriteAt < WRITE_SETTLE_MS;
}

/**
 * The RTK Query cache (flat rows per domain, in sheet order) is the single
 * source of truth. Mutations patch it optimistically and roll back on failure;
 * they do NOT refetch, because the sheet export can briefly lag behind a write.
 */
export const studyApi = createApi({
  reducerPath: "studyApi",
  baseQuery: fakeBaseQuery<ApiError>(),
  endpoints: (builder) => ({
    getRows: builder.query<StudyRow[], StudyDomain>({
      queryFn: async (domain, api) => {
        const startedAt = Date.now();
        try {
          const table = await readTable(domain);
          if (table.missing) throw new Error(`The “${SHEET_NAME[domain]}” tab was not found in the sheet.`);
          const rows = rowsFromTable(table.rows);
          if (readIsStale(startedAt)) {
            const current = selectCachedRows(api.getState(), domain);
            if (current) return { data: current };
          }
          useSyncStatus.getState().markSynced();
          return { data: rows };
        } catch (e) {
          return { error: toError(e) };
        }
      },
    }),

    createRow: builder.mutation<null, SaveArgs>({
      queryFn: async ({ domain, row }) => {
        try {
          await writeRow("CREATE", domain, toPayload(row, domain));
          return { data: null };
        } catch (e) {
          return { error: toError(e) };
        }
      },
      onQueryStarted: async ({ domain, row }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          studyApi.util.updateQueryData("getRows", domain, (draft) => {
            draft.push(row as StudyRow & { links: LinkItem[] });
          }),
        );
        queryFulfilled.catch(patch.undo);
      },
    }),

    updateRow: builder.mutation<null, SaveArgs>({
      queryFn: async ({ domain, row }) => {
        try {
          await writeRow("UPDATE", domain, toPayload(row, domain));
          return { data: null };
        } catch (e) {
          return { error: toError(e) };
        }
      },
      onQueryStarted: async ({ domain, row }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          studyApi.util.updateQueryData("getRows", domain, (draft) => {
            const i = draft.findIndex((r) => r.id === row.id);
            if (i !== -1) draft[i] = row as StudyRow & { links: LinkItem[] };
          }),
        );
        queryFulfilled.catch(patch.undo);
      },
    }),

    deleteRow: builder.mutation<null, DeleteArgs>({
      queryFn: async ({ domain, id }) => {
        try {
          await writeRow("DELETE", domain, { id });
          return { data: null };
        } catch (e) {
          return { error: toError(e) };
        }
      },
      onQueryStarted: async ({ domain, id }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          studyApi.util.updateQueryData("getRows", domain, (draft) =>
            draft.filter((r) => r.id !== id),
          ),
        );
        queryFulfilled.catch(patch.undo);
      },
    }),

    swapRows: builder.mutation<null, SwapArgs>({
      queryFn: async ({ domain, id1, id2 }) => {
        try {
          await writeRow("SWAP", domain, { id1, id2 });
          return { data: null };
        } catch (e) {
          return { error: toError(e) };
        }
      },
      onQueryStarted: async ({ domain, id1, id2 }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          studyApi.util.updateQueryData("getRows", domain, (draft) => {
            const a = draft.findIndex((r) => r.id === id1);
            const b = draft.findIndex((r) => r.id === id2);
            if (a !== -1 && b !== -1) [draft[a], draft[b]] = [draft[b], draft[a]];
          }),
        );
        queryFulfilled.catch(patch.undo);
      },
    }),

    /* ---------------------------------------------------------- Study Log */

    getLog: builder.query<LogData, void>({
      queryFn: async (_arg, api) => {
        const startedAt = Date.now();
        try {
          const table = await readTable("LOG");
          const data: LogData = table.missing
            ? { entries: [], missing: true }
            : { entries: logEntriesFromTable(table.rows), missing: false };
          if (readIsStale(startedAt)) {
            const current = selectCachedLog(api.getState());
            if (current) return { data: current };
          }
          return { data };
        } catch (e) {
          return { error: toError(e) };
        }
      },
    }),

    createLog: builder.mutation<null, LogEntry>({
      queryFn: async (entry) => {
        try {
          assertLogWritable();
          await writeRow("CREATE", "LOG", toLogPayload(entry));
          return { data: null };
        } catch (e) {
          // Idempotent: retrying a timer finish re-sends the same deterministic ids.
          if (alreadyExists(e)) return { data: null };
          return { error: toError(e) };
        }
      },
      onQueryStarted: async (entry, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          studyApi.util.updateQueryData("getLog", undefined, (draft) => {
            if (!draft.entries.some((x) => x.id === entry.id)) draft.entries.push(entry);
            draft.missing = false;
          }),
        );
        queryFulfilled.catch(patch.undo);
      },
    }),

    updateLog: builder.mutation<null, LogEntry>({
      queryFn: async (entry) => {
        try {
          assertLogWritable();
          await writeRow("UPDATE", "LOG", toLogPayload(entry));
          return { data: null };
        } catch (e) {
          return { error: toError(e) };
        }
      },
      onQueryStarted: async (entry, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          studyApi.util.updateQueryData("getLog", undefined, (draft) => {
            const i = draft.entries.findIndex((x) => x.id === entry.id);
            if (i !== -1) draft.entries[i] = entry;
          }),
        );
        queryFulfilled.catch(patch.undo);
      },
    }),

    deleteLog: builder.mutation<null, string>({
      queryFn: async (id) => {
        try {
          assertLogWritable();
          await writeRow("DELETE", "LOG", { id });
          return { data: null };
        } catch (e) {
          return { error: toError(e) };
        }
      },
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          studyApi.util.updateQueryData("getLog", undefined, (draft) => {
            draft.entries = draft.entries.filter((x) => x.id !== id);
          }),
        );
        queryFulfilled.catch(patch.undo);
      },
    }),

    /* ------------------------------------------------------ Study timer */

    getSessions: builder.query<SessionsData, void>({
      queryFn: async (_arg, api) => {
        const startedAt = Date.now();
        try {
          const table = await readTable("SESSIONS");
          const data: SessionsData = table.missing
            ? { sessions: [], missing: true }
            : { sessions: sessionsFromTable(table.rows), missing: false };
          if (readIsStale(startedAt)) {
            const current = selectCachedSessions(api.getState());
            if (current) return { data: current };
          }
          return { data };
        } catch (e) {
          return { error: toError(e) };
        }
      },
    }),

    saveSession: builder.mutation<null, { session: StudySession; isNew: boolean }>({
      queryFn: async ({ session, isNew }) => {
        try {
          assertTimerWritable();
          await writeRow(isNew ? "CREATE" : "UPDATE", "SESSIONS", toSessionPayload(session));
          return { data: null };
        } catch (e) {
          if (isNew && alreadyExists(e)) return { data: null };
          return { error: toError(e) };
        }
      },
      onQueryStarted: async ({ session }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          studyApi.util.updateQueryData("getSessions", undefined, (draft) => {
            const i = draft.sessions.findIndex((x) => x.id === session.id);
            if (i === -1) draft.sessions.unshift(session as MutableSession);
            else draft.sessions[i] = session as MutableSession;
            draft.missing = false;
          }),
        );
        queryFulfilled.catch(patch.undo);
      },
    }),

    deleteSession: builder.mutation<null, string>({
      queryFn: async (id) => {
        try {
          assertTimerWritable();
          await writeRow("DELETE", "SESSIONS", { id });
          return { data: null };
        } catch (e) {
          // Already gone (e.g. finished on another device) is fine.
          if (e instanceof Error && /not found/i.test(e.message)) return { data: null };
          return { error: toError(e) };
        }
      },
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          studyApi.util.updateQueryData("getSessions", undefined, (draft) => {
            draft.sessions = draft.sessions.filter((x) => x.id !== id);
          }),
        );
        queryFulfilled.catch(patch.undo);
      },
    }),

    /* -------------------------------------------------------- Settings */

    getSettings: builder.query<SettingsData, void>({
      queryFn: async (_arg, api) => {
        const startedAt = Date.now();
        try {
          const table = await readTable("SETTINGS");
          const values = table.missing ? {} : settingsFromTable(table.rows);
          const data: SettingsData = { values, existingKeys: Object.keys(values), missing: table.missing };
          if (readIsStale(startedAt)) {
            const current = selectCachedSettings(api.getState());
            if (current) return { data: current };
          }
          return { data };
        } catch (e) {
          return { error: toError(e) };
        }
      },
    }),

    /** Upserts several settings: UPDATE keys that exist in the sheet, CREATE the rest. */
    saveSettings: builder.mutation<null, Partial<Record<SettingKey, number>>>({
      queryFn: async (changes, api) => {
        try {
          assertTimerWritable();
          const existing = selectCachedSettings(api.getState())?.existingKeys ?? [];
          for (const [key, value] of Object.entries(changes)) {
            const payload = { id: key, value: String(value) };
            if (existing.includes(key)) {
              await writeRow("UPDATE", "SETTINGS", payload);
            } else {
              try {
                await writeRow("CREATE", "SETTINGS", payload);
              } catch (e) {
                if (!alreadyExists(e)) throw e;
                await writeRow("UPDATE", "SETTINGS", payload);
              }
            }
          }
          return { data: null };
        } catch (e) {
          return { error: toError(e) };
        }
      },
      onQueryStarted: async (changes, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          studyApi.util.updateQueryData("getSettings", undefined, (draft) => {
            for (const [k, v] of Object.entries(changes)) draft.values[k] = String(v);
          }),
        );
        try {
          await queryFulfilled;
          // Every saved key now has a row in the sheet.
          dispatch(
            studyApi.util.updateQueryData("getSettings", undefined, (draft) => {
              draft.existingKeys = [...new Set([...draft.existingKeys, ...Object.keys(changes)])];
              draft.missing = false;
            }),
          );
        } catch {
          patch.undo();
        }
      },
    }),
  }),
});

selectCachedSessions = (state) =>
  studyApi.endpoints.getSessions.select()(state as Parameters<ReturnType<typeof studyApi.endpoints.getSessions.select>>[0]).data;
selectCachedSettings = (state) =>
  studyApi.endpoints.getSettings.select()(state as Parameters<ReturnType<typeof studyApi.endpoints.getSettings.select>>[0]).data;

selectCachedLog = (state) =>
  studyApi.endpoints.getLog.select()(state as Parameters<ReturnType<typeof studyApi.endpoints.getLog.select>>[0]).data;

selectCachedRows = (state, domain) =>
  studyApi.endpoints.getRows.select(domain)(state as Parameters<ReturnType<typeof studyApi.endpoints.getRows.select>>[0]).data;

export const {
  useGetRowsQuery,
  useCreateRowMutation,
  useUpdateRowMutation,
  useDeleteRowMutation,
  useSwapRowsMutation,
  useGetLogQuery,
  useCreateLogMutation,
  useUpdateLogMutation,
  useDeleteLogMutation,
  useGetSessionsQuery,
  useSaveSessionMutation,
  useDeleteSessionMutation,
  useGetSettingsQuery,
  useSaveSettingsMutation,
} = studyApi;
