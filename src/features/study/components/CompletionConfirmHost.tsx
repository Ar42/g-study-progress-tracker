import { ConfirmDialog } from "../../../components/ui";
import { useCompletion } from "../completion";

/** Rendered once (AppShell). */
export function CompletionConfirmHost() {
  const pending = useCompletion((s) => s.pending);
  const answer = useCompletion((s) => s.answer);
  return (
    <ConfirmDialog
      open={pending !== null}
      title="Mark as completed?"
      confirmLabel="Yes, it's done"
      message={
        <>
          <span className="font-semibold text-success">{pending?.name}</span> will be marked completed today. You can change it back anytime.
        </>
      }
      onCancel={() => answer(false)}
      onConfirm={() => answer(true)}
    />
  );
}
