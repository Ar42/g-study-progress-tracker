import { create } from "zustand";
import type { Subject, StudyNode } from "../types";
import { ProgressStatus } from "../enums/progress";
import { SUBJECTS } from "../data/loader";

interface StudyStore {
  readonly subjects: readonly Subject[];
  readonly loadSubjects: () => void;
  readonly updateLeafStatus: (subjectId: string, nodeId: string, status: ProgressStatus) => void;
}

// Helper function to recursively update a node in the children tree
function updateNodeInTree(nodes: readonly StudyNode[], nodeId: string, status: ProgressStatus): readonly StudyNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      // Leaf Node (since only leaf nodes have status and we find by unique id)
      return {
        ...node,
        status,
      };
    }
    if ("children" in node && Array.isArray(node.children)) {
      return {
        ...node,
        children: updateNodeInTree(node.children, nodeId, status),
      };
    }
    return node;
  });
}

export const useStudyStore = create<StudyStore>((set) => ({
  subjects: [],
  loadSubjects: () => {
    set({ subjects: SUBJECTS });
  },
  updateLeafStatus: (subjectId: string, nodeId: string, status: ProgressStatus) => {
    set((state) => ({
      subjects: state.subjects.map((subj) => {
        if (subj.id !== subjectId) return subj;
        return {
          ...subj,
          children: updateNodeInTree(subj.children, nodeId, status),
        };
      }),
    }));
  },
}));
