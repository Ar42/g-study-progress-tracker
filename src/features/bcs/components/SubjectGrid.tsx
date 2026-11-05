import type { DragEvent } from "react";
import type { Subject } from "../../../types";
import { useStudyActions } from "../../study/hooks/useStudyActions";
import { useDragSwap } from "../../study/hooks/useDragSwap";
import { SubjectCard } from "./SubjectCard";

/** Subject cards; drag one onto another to swap their order in the sheet. */
export function SubjectGrid({ subjects }: { readonly subjects: readonly Subject[] }) {
  const { swap } = useStudyActions("BCS");
  const dnd = useDragSwap((a, b) => void swap(a, b));

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {subjects.map((s) => (
        <SubjectCard
          key={s.row.id}
          subject={s}
          dragging={dnd.dragId === s.row.id}
          dropTarget={dnd.overId === s.row.id}
          dragHandlers={{
            onDragStart: (e: DragEvent) => dnd.start(e, s.row.id),
            onDragOver: (e: DragEvent) => dnd.over(e, s.row.id),
            onDragLeave: (e: DragEvent) => dnd.leave(e, s.row.id),
            onDrop: (e: DragEvent) => dnd.drop(e, s.row.id),
            onDragEnd: dnd.end,
          }}
        />
      ))}
    </div>
  );
}
