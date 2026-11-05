import { ProgressStatus, type DisplayStatus, type StatusFilter } from "../enums/progress";
import type { ProgressStats, StudyRow, Subject, Topic, TreeNode } from "../types";
import { getDisplayStatus } from "./status";

export function toStats(completed: number, total: number): ProgressStats {
  return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

/**
 * Builds the BCS subject → chapter hierarchy from flat sheet rows, preserving
 * sheet order. Rows with is_subject=FALSE and no parent are drafts and are hidden.
 * Progress is counted on leaf chapters only.
 */
export function buildSubjects(rows: readonly StudyRow[], today: string): Subject[] {
  const childrenOf = new Map<string, StudyRow[]>();
  for (const row of rows) {
    const parent = row.parentId.trim();
    if (!parent || row.isSubject) continue;
    const list = childrenOf.get(parent);
    if (list) list.push(row);
    else childrenOf.set(parent, [row]);
  }

  const build = (row: StudyRow, seen: Set<string>): TreeNode => {
    const nextSeen = new Set(seen).add(row.id);
    const children = (childrenOf.get(row.id) ?? [])
      .filter((c) => !nextSeen.has(c.id)) // guards against accidental cycles
      .map((c) => build(c, nextSeen));
    const isLeaf = children.length === 0 && !row.isSubject;
    const status = getDisplayStatus(row, today);

    if (isLeaf) {
      return {
        row,
        status,
        children,
        isLeaf,
        stats: toStats(status === ProgressStatus.COMPLETED ? 1 : 0, 1),
      };
    }
    const completed = children.reduce((s, c) => s + c.stats.completed, 0);
    const total = children.reduce((s, c) => s + c.stats.total, 0);
    return { row, status, children, isLeaf, stats: toStats(completed, total) };
  };

  return rows
    .filter((r) => r.isSubject)
    .map((r) => ({ ...build(r, new Set()), marks: Number(r.preliMarks) || 0 }));
}

export function buildTopics(rows: readonly StudyRow[], today: string): Topic[] {
  return rows.map((row) => ({ row, status: getDisplayStatus(row, today) }));
}

/** Returns a copy of the tree keeping only leaves that match, plus their ancestors. */
export function filterTree(nodes: readonly TreeNode[], filter: StatusFilter): TreeNode[] {
  if (filter === "ALL") return [...nodes];
  const out: TreeNode[] = [];
  for (const node of nodes) {
    if (node.isLeaf) {
      if (node.status === filter) out.push(node);
      continue;
    }
    const kids = filterTree(node.children, filter);
    if (kids.length > 0) out.push({ ...node, children: kids });
  }
  return out;
}

export function collectLeaves(nodes: readonly TreeNode[]): TreeNode[] {
  return nodes.flatMap((n) => (n.isLeaf ? [n] : collectLeaves(n.children)));
}

export function findNode(nodes: readonly TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.row.id === id) return n;
    const hit = findNode(n.children, id);
    if (hit) return hit;
  }
  return null;
}

export function isDescendant(node: TreeNode, id: string): boolean {
  return node.children.some((c) => c.row.id === id || isDescendant(c, id));
}

export function countByStatus(statuses: readonly DisplayStatus[]): Record<DisplayStatus, number> {
  const counts: Record<DisplayStatus, number> = {
    NOT_STARTED: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    OVERDUE: 0,
  };
  for (const s of statuses) counts[s]++;
  return counts;
}
