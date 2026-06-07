import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Subject, LinkItem } from "../types";
import { ProgressStatus } from "../enums/progress";

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/16YFBrX2muNuj2NXNDb_YDnlwEJptKEYBnCv0YHiFnuQ/export?format=csv&gid=0";

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

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
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
        const lines = response.split(/\r?\n/);
        if (lines.length < 2) {
          throw new Error("Sheet is empty or has no rows.");
        }

        const headers = parseCsvLine(lines[0]).map((h) =>
          h.toLowerCase().replace(/\s+/g, ""),
        );
        const idIndex = headers.indexOf("id");
        const nameIndex = headers.indexOf("name");
        const parentIdIndex = headers.indexOf("parentid");
        const statusIndex = headers.indexOf("status");

        const preliMarksIndex = headers.indexOf("prelimarks");
        const commentsIndex = headers.indexOf("comments");
        const startedDateIndex = headers.indexOf("starteddate");
        const targetDateIndex = headers.indexOf("targettocompletedate");
        const completedDateIndex = headers.indexOf("completeddate");
        const linksIndex =
          headers.indexOf("links") !== -1
            ? headers.indexOf("links")
            : headers.indexOf("link");
        const isSubjectIndex = headers.indexOf("is_subject") !== -1
            ? headers.indexOf("is_subject")
            : headers.indexOf("issubject");

        if (idIndex === -1 || nameIndex === -1) {
          throw new Error(
            "Invalid CSV structure: Missing 'Id' or 'Name' columns in sheet.",
          );
        }

        const rows: SheetRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const cols = parseCsvLine(line);
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

          // Treat as root subject if is_subject is explicitly true, or fallback to parentId check
          if (r.is_subject || (!r.parentId && r.is_subject !== false)) {
            subjects.push({
              ...node,
              children: node.children || [],
            });
          } else if (r.parentId) {
            const parentNode = nodeMap.get(r.parentId);
            if (parentNode && parentNode.children) {
              parentNode.children.push(node);
            }
          }
        });

        if (subjects.length === 0) {
          throw new Error(
            "Could not parse any subjects from sheet hierarchy data.",
          );
        }

        return subjects;
      },
    }),
  }),
});

export const { useFetchStudyDataQuery, useLazyFetchStudyDataQuery } = sheetApi;
