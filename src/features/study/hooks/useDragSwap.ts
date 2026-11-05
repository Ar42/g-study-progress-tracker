import { useState, type DragEvent } from "react";

/** Minimal HTML5 drag state for "drop A on B to swap them" lists. */
export function useDragSwap(onSwap: (sourceId: string, targetId: string) => void) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  return {
    dragId,
    overId,
    start: (e: DragEvent, id: string) => {
      e.dataTransfer.setData("text/plain", id);
      e.dataTransfer.effectAllowed = "move";
      setDragId(id);
    },
    over: (e: DragEvent, id: string) => {
      if (!dragId || dragId === id) return;
      e.preventDefault();
      if (overId !== id) setOverId(id);
    },
    leave: (e: DragEvent, id: string) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null) && overId === id) setOverId(null);
    },
    drop: (e: DragEvent, id: string) => {
      e.preventDefault();
      const source = dragId;
      setDragId(null);
      setOverId(null);
      if (source && source !== id) onSwap(source, id);
    },
    end: () => {
      setDragId(null);
      setOverId(null);
    },
  };
}
