import type { DisplayStatus } from "../../enums/progress";
import { collectLeaves } from "../../lib/tree";
import type { StudyDomain, StudyRow, Subject, Topic } from "../../types";

export type FocusStatus = Extract<DisplayStatus, "OVERDUE" | "IN_PROGRESS">;

export interface FocusItem {
  readonly row: StudyRow;
  readonly status: DisplayStatus;
  readonly domain: StudyDomain;
}

export interface FocusGroup {
  readonly key: string;
  readonly title: string;
  readonly href: string;
  readonly items: readonly FocusItem[];
}

/** Items with the given status, grouped by BCS subject (plus one "IT" group). */
export function buildFocusGroups(
  subjects: readonly Subject[],
  topics: readonly Topic[],
  status: FocusStatus,
): FocusGroup[] {
  const groups: FocusGroup[] = subjects
    .map((s) => ({
      key: s.row.id,
      title: s.row.name,
      href: `/subject/${encodeURIComponent(s.row.id)}`,
      items: collectLeaves(s.children)
        .filter((l) => l.status === status)
        .map((l) => ({ row: l.row, status: l.status, domain: "BCS" as const })),
    }))
    .filter((g) => g.items.length > 0);

  const it = topics.filter((t) => t.status === status).map((t) => ({ ...t, domain: "IT" as const }));
  if (it.length > 0) groups.push({ key: "__it", title: "IT", href: "/it", items: it });
  return groups;
}

export const countItems = (groups: readonly FocusGroup[]) => groups.reduce((n, g) => n + g.items.length, 0);
