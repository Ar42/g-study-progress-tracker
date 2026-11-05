import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { WRITE_SETTLE_MS } from "../config/constants";
import type { LinkItem, StudyDomain, StudyRow } from "../types";
import { readRows, writeRow } from "./sheetClient";
import { toPayload } from "./rowMapper";
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

/** Assigned below once the API exists (keeps TypeScript inference non-circular). */
let selectCachedRows: (state: unknown, domain: StudyDomain) => StudyRow[] | undefined = () => undefined;

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
          const rows = await readRows(domain);
          const { pending, lastWriteAt } = useSyncStatus.getState();
          const wroteSinceStart = lastWriteAt >= startedAt;
          const settling = Date.now() - lastWriteAt < WRITE_SETTLE_MS;
          if (pending > 0 || wroteSinceStart || settling) {
            // A write happened while we were reading: this snapshot may be
            // older than what's on screen. Keep the local (optimistic) state.
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
  }),
});

selectCachedRows = (state, domain) =>
  studyApi.endpoints.getRows.select(domain)(state as Parameters<ReturnType<typeof studyApi.endpoints.getRows.select>>[0]).data;

export const {
  useGetRowsQuery,
  useCreateRowMutation,
  useUpdateRowMutation,
  useDeleteRowMutation,
  useSwapRowsMutation,
} = studyApi;
