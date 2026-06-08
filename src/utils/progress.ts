import { ProgressStatus } from "../enums/progress";
import type { StudyNode, Subject } from "../types";

export interface ProgressStats {
  readonly completed: number;
  readonly total: number;
  readonly percentage: number;
}

export interface MarksStats {
  readonly totalMarks: number;
  readonly obtainedMarks: number;
  readonly remainingMarks: number;
}

/**
 * Recursively counts completed and total leaf nodes under a StudyNode or array of StudyNodes.
 */
export function getLeafStats(nodes: readonly StudyNode[] | StudyNode): { completed: number; total: number } {
  if (Array.isArray(nodes)) {
    let completed = 0;
    let total = 0;
    for (const node of nodes) {
      const stats = getLeafStats(node);
      completed += stats.completed;
      total += stats.total;
    }
    return { completed, total };
  }

  const node = nodes;
  if ("children" in node && Array.isArray(node.children)) {
    return getLeafStats(node.children);
  }

  if ("status" in node) {
    const completed = node.status === ProgressStatus.COMPLETED ? 1 : 0;
    return {
      completed,
      total: 1,
    };
  }

  return { completed: 0, total: 0 };
}

/**
 * Recursively calculates marks from preliMarks in leaf nodes.
 */
export function getMarksStats(nodes: readonly StudyNode[] | StudyNode | Subject): MarksStats {
  if (Array.isArray(nodes)) {
    let totalMarks = 0;
    let obtainedMarks = 0;
    for (const node of nodes) {
      const stats = getMarksStats(node);
      totalMarks += stats.totalMarks;
      obtainedMarks += stats.obtainedMarks;
    }
    return { totalMarks, obtainedMarks, remainingMarks: totalMarks - obtainedMarks };
  }

  const node = nodes as StudyNode;
  if ("children" in node && Array.isArray(node.children)) {
    return getMarksStats(node.children);
  }

  if ("status" in node) {
    const marks = Number(node.preliMarks) || 0;
    const obtained = node.status === ProgressStatus.COMPLETED ? marks : 0;
    return {
      totalMarks: marks,
      obtainedMarks: obtained,
      remainingMarks: marks - obtained,
    };
  }

  return { totalMarks: 0, obtainedMarks: 0, remainingMarks: 0 };
}

/**
 * Calculates dynamic statistics for a node or a Subject.
 */
export function calculateProgress(nodes: readonly StudyNode[] | StudyNode | Subject): ProgressStats {
  let nodesToCalculate: readonly StudyNode[];
  
  if (Array.isArray(nodes)) {
    nodesToCalculate = nodes;
  } else if ("children" in nodes && Array.isArray(nodes.children)) {
    nodesToCalculate = nodes.children;
  } else {
    nodesToCalculate = [nodes as StudyNode];
  }

  const { completed, total } = getLeafStats(nodesToCalculate);
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    completed,
    total,
    percentage,
  };
}
