import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Subject } from "../types";
import { ProgressStatus } from "../enums/progress";
import { SUBJECTS } from "../data/loader";

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/16YFBrX2muNuj2NXNDb_YDnlwEJptKEYBnCv0YHiFnuQ/export?format=csv&gid=0";

interface SheetRow {
  readonly id: string;
  readonly name: string;
  readonly parentId: string;
  readonly status: ProgressStatus;
}

export interface FetchStudyDataResult {
  readonly subjects: readonly Subject[];
  readonly isFallback: boolean;
  readonly errorMsg?: string;
}

export const sheetApi = createApi({
  reducerPath: "sheetApi",
  baseQuery: fetchBaseQuery({ baseUrl: "" }),
  endpoints: (builder) => ({
    fetchStudyData: builder.query<FetchStudyDataResult, void>({
      query: () => ({
        url: SHEET_CSV_URL,
        responseHandler: "text",
      }),
      transformResponse: (response: string): FetchStudyDataResult => {
        try {
          const lines = response.split(/\r?\n/);
          if (lines.length < 2) {
            return { subjects: SUBJECTS, isFallback: true, errorMsg: "Sheet is empty" };
          }

          const headers = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());
          const idIndex = headers.indexOf("id");
          const nameIndex = headers.indexOf("name");
          const parentIdIndex = headers.indexOf("parentid");
          const statusIndex = headers.indexOf("status");

          if (idIndex === -1 || nameIndex === -1) {
            return { 
              subjects: SUBJECTS, 
              isFallback: true, 
              errorMsg: "Missing 'Id' or 'Name' headers in sheet. Falling back to local data." 
            };
          }

          const rows: SheetRow[] = [];
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = line.split(",").map((col) => col.replace(/^["']|["']$/g, "").trim());
            if (cols.length <= Math.max(idIndex, nameIndex)) continue;

            const id = cols[idIndex] || "";
            const name = cols[nameIndex] || "";
            const parentId = parentIdIndex !== -1 ? cols[parentIdIndex] || "" : "";
            const statusRaw = statusIndex !== -1 ? cols[statusIndex] || "" : "";

            let status: ProgressStatus = ProgressStatus.NOT_STARTED;
            const normalizedStatus = statusRaw.toUpperCase();
            if (normalizedStatus === "COMPLETED") {
              status = ProgressStatus.COMPLETED;
            } else if (normalizedStatus === "IN_PROGRESS") {
              status = ProgressStatus.IN_PROGRESS;
            }

            if (id && name) {
              rows.push({ id, name, parentId, status });
            }
          }

          if (rows.length === 0) {
            return { subjects: SUBJECTS, isFallback: true, errorMsg: "No rows found in sheet" };
          }

          const parentIds = new Set<string>();
          rows.forEach((r) => {
            if (r.parentId) parentIds.add(r.parentId);
          });

          const nodeMap = new Map<string, any>();
          rows.forEach((r) => {
            const isParent = parentIds.has(r.id);
            if (isParent) {
              nodeMap.set(r.id, {
                id: r.id,
                name: r.name,
                children: [],
              });
            } else {
              nodeMap.set(r.id, {
                id: r.id,
                name: r.name,
                status: r.status,
              });
            }
          });

          const subjects: Subject[] = [];
          rows.forEach((r) => {
            const node = nodeMap.get(r.id);
            if (!node) return;

            if (!r.parentId) {
              subjects.push({
                id: r.id,
                name: r.name,
                children: node.children || [],
              });
            } else {
              const parentNode = nodeMap.get(r.parentId);
              if (parentNode && parentNode.children) {
                parentNode.children.push(node);
              }
            }
          });

          if (subjects.length === 0) {
            return { subjects: SUBJECTS, isFallback: true, errorMsg: "No root subjects resolved" };
          }

          return { subjects, isFallback: false };
        } catch (e: any) {
          return { subjects: SUBJECTS, isFallback: true, errorMsg: e.message || "Parsing error" };
        }
      },
    }),
  }),
});

export const { useFetchStudyDataQuery } = sheetApi;
