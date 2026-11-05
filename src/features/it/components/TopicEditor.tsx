import { useState } from "react";
import { ConfirmDialog } from "../../../components/ui";
import type { StudyRow } from "../../../types";
import { StudyItemFormModal } from "../../study/components/StudyItemFormModal";
import { useStudyActions } from "../../study/hooks/useStudyActions";

export interface TopicEditorState {
  readonly mode: "create" | "edit";
  readonly row: StudyRow;
}

export function TopicEditor({ state, onClose }: { readonly state: TopicEditorState | null; readonly onClose: () => void }) {
  const actions = useStudyActions("IT");
  const [confirmDelete, setConfirmDelete] = useState<StudyRow | null>(null);

  return (
    <>
      {state && (
        <StudyItemFormModal
          open
          kind="topic"
          mode={state.mode}
          initial={state.row}
          onClose={onClose}
          onSubmit={(row) => {
            onClose();
            if (state.mode === "create") void actions.create(row);
            else void actions.update(row);
          }}
          onDelete={() => setConfirmDelete(state.row)}
        />
      )}
      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete topic?"
        tone="danger"
        confirmLabel="Delete"
        message={
          <>
            <span className="font-medium text-fg">{confirmDelete?.name}</span> will be removed from your Google Sheet.
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
