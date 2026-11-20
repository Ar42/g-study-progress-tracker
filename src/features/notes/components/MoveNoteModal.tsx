import { useMemo, useState } from "react";
import { Home } from "lucide-react";
import { Button, Modal } from "../../../components/ui";
import { cn } from "../../../lib/cn";
import { canMoveTo, childrenOf } from "../../../lib/noteTree";
import type { NoteItem } from "../../../types";
import { NoteIcon } from "./NoteIcon";

interface Row {
  readonly id: string;
  readonly name: string;
  readonly depth: number;
}

/** Every folder as an indented list, top level first. */
function folderRows(items: readonly NoteItem[], parentId = "", depth = 1): Row[] {
  return childrenOf(items, parentId)
    .filter((i) => i.type === "FOLDER")
    .flatMap((f) => [{ id: f.id, name: f.name, depth }, ...folderRows(items, f.id, depth + 1)]);
}

export interface MoveNoteModalProps {
  readonly item: NoteItem;
  readonly items: readonly NoteItem[];
  readonly onClose: () => void;
  readonly onMove: (targetId: string, targetName: string) => void;
}

/** Pick the destination folder. Works on phones (no drag needed). */
export function MoveNoteModal({ item, items, onClose, onMove }: MoveNoteModalProps) {
  const rows = useMemo(() => [{ id: "", name: "Notes (top level)", depth: 0 }, ...folderRows(items)], [items]);
  const [target, setTarget] = useState<string | null>(null);
  const chosen = rows.find((r) => r.id === target);

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title={`Move “${item.name}”`}
      description="Choose a folder"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!chosen} onClick={() => chosen && onMove(chosen.id, chosen.depth === 0 ? "top level" : chosen.name)}>
            Move here
          </Button>
        </>
      }
    >
      <ul role="listbox" aria-label="Folders" className="max-h-[50vh] space-y-0.5 overflow-y-auto">
        {rows.map((r) => {
          const allowed = canMoveTo(items, item, r.id);
          const current = r.id === item.parentId;
          return (
            <li key={r.id || "root"}>
              <button
                type="button"
                role="option"
                aria-selected={target === r.id}
                disabled={!allowed}
                onClick={() => setTarget(r.id)}
                style={{ paddingLeft: `${0.75 + r.depth * 1.1}rem` }}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg py-2 pr-3 text-left text-sm transition-colors disabled:cursor-not-allowed",
                  target === r.id ? "bg-primary-soft font-semibold text-primary" : "text-fg hover:bg-surface-2",
                  !allowed && "opacity-40 hover:bg-transparent",
                )}
              >
                {r.depth === 0 ? <Home className="size-4 shrink-0 text-fg-subtle" /> : <NoteIcon type="FOLDER" className="size-4" />}
                <span className="min-w-0 flex-1 truncate">{r.name}</span>
                {current && <span className="text-xs text-fg-subtle">current</span>}
                {!allowed && !current && r.id === item.id && <span className="text-xs text-fg-subtle">this folder</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
