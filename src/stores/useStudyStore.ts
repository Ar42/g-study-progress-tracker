import { create } from "zustand";
import type { Subject, StudyNode } from "../types";
import { ProgressStatus } from "../enums/progress";

export interface ToastMessage {
  readonly id: string;
  readonly message: string;
  readonly type: "success" | "info" | "error";
}

interface StudyStore {
  readonly subjects: readonly Subject[];
  readonly toast: ToastMessage | null;
  readonly setSubjects: (subjects: readonly Subject[]) => void;
  readonly updateLeafStatus: (subjectId: string, nodeId: string, status: ProgressStatus) => void;
  readonly showToast: (message: string, type?: "success" | "info" | "error") => void;
  readonly clearToast: () => void;
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

export const useStudyStore = create<StudyStore>((set, get) => ({
  subjects: [],
  toast: null,
  setSubjects: (subjects) => {
    set({ subjects });
  },
  showToast: (message, type = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    set({ toast: { id, message, type } });
    
    // Auto-dismiss after 3.5 seconds
    setTimeout(() => {
      const currentToast = get().toast;
      if (currentToast && currentToast.id === id) {
        get().clearToast();
      }
    }, 3500);
  },
  clearToast: () => {
    set({ toast: null });
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
    get().showToast("Progress updated!", "success");
  },
}));
