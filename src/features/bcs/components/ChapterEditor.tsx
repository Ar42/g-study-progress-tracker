import { useMemo, useState } from "react";
import { ConfirmDialog } from "../../../components/ui";
import type { StudyRow, Subject } from "../../../types";
import { buildParentOptions } from "../parentOptions";
import { StudyItemFormModal } from "../../study/components/StudyItemFormModal";
import { useStudyActions } from "../../study/hooks/useStudyActions";
import { findNode } from "../../../lib/tree";

export interface EditorState {
  readonly mode: "create" | "edit";
  readonly kind: "subject" | "chapter";
  readonly row: StudyRow;
}

export interface ChapterEditorProps {
  readonly subject: Subject;
  readonly state: EditorState | null;
  readonly onClose: () => void;
}

/** Create / edit / delete for BCS chapters and subject details. */
export function ChapterEditor({ subject, state, onClose }: ChapterEditorProps) {
  const actions = useStudyActions("BCS");
  const [confirmDelete, setConfirmDelete] = useState<StudyRow | null>(null);

  const editingId = state?.mode === "edit" ? state.row.id : null;
  const parentOptions = useMemo(() => buildParentOptions(subject, editingId), [subject, editingId]);
  const node = editingId ? findNode(subject.children, editingId) : null;
  const hasChildren = Boolean(node && node.children.length > 0);

  return (
    <>
      {state && (
        <StudyItemFormModal
          open
          kind={state.kind}
          mode={state.mode}
          initial={state.row}
          parentOptions={state.kind === "chapter" ? parentOptions : undefined}
          onClose={onClose}
          onSubmit={(row) => {
            onClose();
            if (state.mode === "create") void actions.create(row);
            else void actions.update(row);
          }}
          onDelete={state.kind === "chapter" ? () => setConfirmDelete(state.row) : undefined}
          deleteDisabledReason={hasChildren ? "Move or delete the chapters inside it first" : undefined}
        />
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete chapter?"
        tone="danger"
        confirmLabel="Delete"
        message={
          <>
            <span className="font-medium text-fg">{confirmDelete?.name}</span> will be removed from your Google Sheet.
            This can't be undone from the app.
          </>
        }
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          const row = confirmDelete;
          setConfirmDelete(null);
          onClose();
          if (row) void actions.remove(row);
        }}
      />
    </>
  );
}
