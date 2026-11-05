import { useCallback } from "react";
import { toast } from "sonner";
import { findNode, isDescendant } from "../../../lib/tree";
import type { Subject, TreeNode } from "../../../types";
import { useStudyActions } from "../../study/hooks/useStudyActions";

/**
 * Drag & drop re-parenting: dropping on a chapter that has children moves the
 * dragged chapter inside it; dropping on a plain chapter makes them siblings.
 */
export function useChapterMove(subject: Subject | undefined) {
  const { update } = useStudyActions("BCS");

  return useCallback(
    (draggedId: string, target: TreeNode) => {
      if (!subject) return;
      const dragged = findNode(subject.children, draggedId);
      if (!dragged) return;

      const newParentId = target.isLeaf ? target.row.parentId || subject.row.id : target.row.id;
      if (newParentId === dragged.row.parentId) return;
      if (newParentId === dragged.row.id || isDescendant(dragged, newParentId)) {
        toast.error("Can't move a chapter inside itself.");
        return;
      }
      const destination = newParentId === subject.row.id ? "top level" : findNode(subject.children, newParentId)?.row.name;
      void update({ ...dragged.row, parentId: newParentId }, `Moved “${dragged.row.name}” to ${destination}`);
    },
    [subject, update],
  );
}
