import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Subject, LinkItem, ITTopic } from "../types";
import { ProgressStatus } from "../enums/progress";

const SHEET_CSV_URL =
  import.meta.env.VITE_SHEET_CSV_URL ||
  "https://docs.google.com/spreadsheets/d/16YFBrX2muNuj2NXNDb_YDnlwEJptKEYBnCv0YHiFnuQ/export?format=csv&gid=0";

function getItSheetCsvUrl(): string {
  if (import.meta.env.VITE_IT_SHEET_CSV_URL) {
    return import.meta.env.VITE_IT_SHEET_CSV_URL;
  }
  const match = SHEET_CSV_URL.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return `https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq?tqx=out:csv&sheet=IT&headers=1`;
  }
  return SHEET_CSV_URL.replace(/gid=[^&]+/, "sheet=IT");
}

const IT_SHEET_CSV_URL = getItSheetCsvUrl();

interface SheetRow {
  readonly id: string;
  readonly name: string;
  readonly parentId: string;
  readonly status: ProgressStatus;
  readonly preliMarks?: string;
  readonly comments?: string;
  readonly startedDate?: string;
  readonly targetToCompleteDate?: string;
  readonly completedDate?: string;
  readonly links?: readonly LinkItem[];
  readonly is_subject?: boolean;
}

/**
 * Robust RFC 4180 compliant CSV parser that supports multiline fields, quotes, and commas.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && text[i + 1] === "\n") {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export const sheetApi = createApi({
  reducerPath: "sheetApi",
  baseQuery: fetchBaseQuery({ baseUrl: "" }),
  endpoints: (builder) => ({
    fetchStudyData: builder.query<readonly Subject[], void>({
      query: () => ({
        url: SHEET_CSV_URL,
        responseHandler: "text",
      }),
      transformResponse: (response: string): readonly Subject[] => {
        const rowsParsed = parseCsv(response);
        if (rowsParsed.length < 2) {
          throw new Error("Sheet is empty or has no rows.");
        }

        const headers = rowsParsed[0].map((h) =>
          h.toLowerCase().replace(/[\s_]+/g, ""),
        );
        const idIndex = headers.findIndex((h) => h === "id" || h.startsWith("id"));
        const nameIndex = headers.findIndex((h) => h === "name" || h.startsWith("name"));
        const parentIdIndex = headers.findIndex((h) => h === "parentid" || h.startsWith("parentid"));
        const statusIndex = headers.findIndex((h) => h === "status" || h.startsWith("status"));

        const preliMarksIndex = headers.findIndex((h) => h === "prelimarks" || h.startsWith("prelimarks"));
        const commentsIndex = headers.findIndex((h) => h === "comments" || h.startsWith("comments"));
        const startedDateIndex = headers.findIndex((h) => h === "starteddate" || h.startsWith("starteddate"));
        const targetDateIndex = headers.findIndex((h) => h === "targettocompletedate" || h.startsWith("targettocompletedate"));
        const completedDateIndex = headers.findIndex((h) => h === "completeddate" || h.startsWith("completeddate"));
        const linksIndex = headers.findIndex(
          (h) => h === "links" || h === "link" || h.startsWith("link"),
        );
        const isSubjectIndex = headers.findIndex(
          (h) => h === "is_subject" || h === "issubject" || h.startsWith("issubject"),
        );

        if (idIndex === -1 || nameIndex === -1) {
          throw new Error(
            "Invalid CSV structure: Missing 'Id' or 'Name' columns in sheet.",
          );
        }

        const rows: SheetRow[] = [];
        for (let i = 1; i < rowsParsed.length; i++) {
          const cols = rowsParsed[i];
          if (cols.length <= Math.max(idIndex, nameIndex)) continue;

          const id = cols[idIndex] || "";
          const name = cols[nameIndex] || "";
          const parentId =
            parentIdIndex !== -1 ? cols[parentIdIndex] || "" : "";
          const statusRaw = statusIndex !== -1 ? cols[statusIndex] || "" : "";

          let status: ProgressStatus = ProgressStatus.NOT_STARTED;
          const normalizedStatus = statusRaw.toUpperCase();
          if (normalizedStatus === "COMPLETED") {
            status = ProgressStatus.COMPLETED;
          } else if (normalizedStatus === "IN_PROGRESS") {
            status = ProgressStatus.IN_PROGRESS;
          }

          const preliMarks =
            preliMarksIndex !== -1 ? cols[preliMarksIndex] || "" : undefined;
          const comments =
            commentsIndex !== -1 ? cols[commentsIndex] || "" : undefined;
          const startedDate =
            startedDateIndex !== -1 ? cols[startedDateIndex] || "" : undefined;
          const targetToCompleteDate =
            targetDateIndex !== -1 ? cols[targetDateIndex] || "" : undefined;
          const completedDate =
            completedDateIndex !== -1
              ? cols[completedDateIndex] || ""
              : undefined;
          const linksRaw = linksIndex !== -1 ? cols[linksIndex] || "" : "";

          let links: LinkItem[] | undefined = undefined;
          if (linksRaw) {
            try {
              links = JSON.parse(linksRaw);
            } catch (e) {
              console.warn(`Failed to parse links for row ${id}:`, e);
            }
          }

          const isSubjectRaw = isSubjectIndex !== -1 ? cols[isSubjectIndex] || "" : "";
          const is_subject = isSubjectRaw.toUpperCase() === "TRUE";

          if (id && name) {
            rows.push({
              id,
              name,
              parentId,
              status,
              preliMarks,
              comments,
              startedDate,
              targetToCompleteDate,
              completedDate,
              links,
              is_subject,
            });
          }
        }

        if (rows.length === 0) {
          throw new Error("No valid study rows found in Google Sheet.");
        }

        const parentIds = new Set<string>();
        rows.forEach((r) => {
          if (r.parentId) parentIds.add(r.parentId);
        });

        const nodeMap = new Map<string, any>();
        rows.forEach((r) => {
          const isParent = parentIds.has(r.id);
          const baseNode = {
            id: r.id,
            name: r.name,
            parentId: r.parentId,
            preliMarks: r.preliMarks,
            comments: r.comments,
            startedDate: r.startedDate,
            targetToCompleteDate: r.targetToCompleteDate,
            completedDate: r.completedDate,
            links: r.links,
            is_subject: r.is_subject,
          };

          if (isParent) {
            nodeMap.set(r.id, {
              ...baseNode,
              children: [],
            });
          } else {
            nodeMap.set(r.id, {
              ...baseNode,
              status: r.status,
            });
          }
        });

        const subjects: Subject[] = [];
        rows.forEach((r) => {
          const node = nodeMap.get(r.id);
          if (!node) return;

          // Only consider as active root subject if is_subject is explicitly TRUE (allows draft subjects with FALSE)
          if (r.is_subject === true) {
            subjects.push({
              ...node,
              children: node.children || [],
            });
          } else if (r.parentId) {
            const parentNode = nodeMap.get(r.parentId.trim());
            if (parentNode) {
              if (!parentNode.children) {
                parentNode.children = [];
              }
              parentNode.children.push(node);
            }
          }
          // If is_subject is FALSE and has no parentId, it is a draft and is ignored
        });

        if (subjects.length === 0) {
          throw new Error(
            "Could not parse any subjects from sheet hierarchy data.",
          );
        }

        return subjects;
      },
    }),
    fetchITStudyData: builder.query<readonly ITTopic[], void>({
      query: () => ({
        url: IT_SHEET_CSV_URL,
        responseHandler: "text",
      }),
      transformResponse: (response: string): readonly ITTopic[] => {
        const rowsParsed = parseCsv(response);
        if (rowsParsed.length < 2) {
          return [];
        }

        const headers = rowsParsed[0].map((h) =>
          h.toLowerCase().replace(/[\s_]+/g, ""),
        );
        const idIndex = headers.findIndex((h) => h === "id" || h.startsWith("id"));
        const nameIndex = headers.findIndex((h) => h === "name" || h.startsWith("name"));
        const statusIndex = headers.findIndex((h) => h === "status" || h.startsWith("status"));
        const commentsIndex = headers.findIndex((h) => h === "comments" || h.startsWith("comments"));
        const startedDateIndex = headers.findIndex((h) => h === "starteddate" || h.startsWith("starteddate"));
        const targetDateIndex = headers.findIndex((h) => h === "targettocompletedate" || h.startsWith("targettocompletedate"));
        const completedDateIndex = headers.findIndex((h) => h === "completeddate" || h.startsWith("completeddate"));
        const linksIndex = headers.findIndex(
          (h) => h === "links" || h === "link" || h.startsWith("link"),
        );

        if (idIndex === -1 || nameIndex === -1) {
          return [];
        }

        const topics: ITTopic[] = [];
        for (let i = 1; i < rowsParsed.length; i++) {
          const cols = rowsParsed[i];
          if (cols.length <= Math.max(idIndex, nameIndex)) continue;

          const id = cols[idIndex] || "";
          const name = cols[nameIndex] || "";
          const statusRaw = statusIndex !== -1 ? cols[statusIndex] || "" : "";

          let status: ProgressStatus = ProgressStatus.NOT_STARTED;
          const normalizedStatus = statusRaw.toUpperCase().trim();
          if (normalizedStatus === "COMPLETED") {
            status = ProgressStatus.COMPLETED;
          } else if (normalizedStatus === "IN_PROGRESS") {
            status = ProgressStatus.IN_PROGRESS;
          } else if (normalizedStatus === "OVERDUE") {
            status = ProgressStatus.OVERDUE;
          }

          const comments = commentsIndex !== -1 ? cols[commentsIndex] || "" : undefined;
          const startedDate = startedDateIndex !== -1 ? cols[startedDateIndex] || "" : undefined;
          const targetToCompleteDate = targetDateIndex !== -1 ? cols[targetDateIndex] || "" : undefined;
          const completedDate = completedDateIndex !== -1 ? cols[completedDateIndex] || "" : undefined;
          const linksRaw = linksIndex !== -1 ? cols[linksIndex] || "" : "";

          let links: LinkItem[] | undefined = undefined;
          if (linksRaw) {
            try {
              links = JSON.parse(linksRaw);
            } catch (e) {
              console.warn(`Failed to parse links for IT row ${id}:`, e);
            }
          }

          if (id && name) {
            topics.push({
              id,
              name,
              status,
              comments,
              startedDate,
              targetToCompleteDate,
              completedDate,
              links,
            });
          }
        }

        return topics;
      },
    }),
  }),
});

export const {
  useFetchStudyDataQuery,
  useLazyFetchStudyDataQuery,
  useFetchITStudyDataQuery,
  useLazyFetchITStudyDataQuery,
} = sheetApi;
