import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, PartyPopper } from "lucide-react";
import { Button, ConfirmDialog, EmptyState, Modal } from "../../../components/ui";
import { ProgressStatus } from "../../../enums/progress";
import { ItemDetails } from "../../study/components/ItemDetails";
import { useStudyActions } from "../../study/hooks/useStudyActions";
import { countItems, type FocusGroup, type FocusItem, type FocusStatus } from "../focus";

const COPY: Record<FocusStatus, { title: string; empty: string; emptyHint: string }> = {
  OVERDUE: {
    title: "Overdue",
    empty: "Nothing overdue",
    emptyHint: "You're on schedule. Keep it up.",
  },
  IN_PROGRESS: {
    title: "In progress",
    empty: "Nothing in progress",
    emptyHint: "Mark a chapter as in progress to see it here.",
  },
};

export interface FocusModalProps {
  readonly status: FocusStatus | null;
  readonly groups: readonly FocusGroup[];
  readonly onClose: () => void;
}

/** Lists overdue / in-progress items grouped by subject, each with "Mark done". */
export function FocusModal({ status, groups, onClose }: FocusModalProps) {
  const bcs = useStudyActions("BCS");
  const it = useStudyActions("IT");
  const [confirm, setConfirm] = useState<FocusItem | null>(null);

  if (!status) return null;
  const copy = COPY[status];
  const total = countItems(groups);

  return (
    <>
      <Modal
        open
        onClose={onClose}
        size="lg"
        title={copy.title}
        description={total > 0 ? `${total} ${total === 1 ? "item" : "items"} across ${groups.length} ${groups.length === 1 ? "subject" : "subjects"}` : undefined}
        footer={
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        }
      >
        {groups.length === 0 ? (
          <EmptyState icon={<PartyPopper />} title={copy.empty} description={copy.emptyHint} className="py-8" />
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <section key={g.key}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <Link
                    to={g.href}
                    onClick={onClose}
                    className="text-xs font-semibold uppercase tracking-wide text-fg-subtle hover:text-primary"
                  >
                    {g.title}
                  </Link>
                  <span className="font-numbers text-xs text-fg-subtle">{g.items.length}</span>
                </div>
                <ul className="space-y-2">
                  {g.items.map((item) => (
                    <li
                      key={item.row.id}
                      className="flex flex-col gap-2 rounded-lg border border-border bg-surface-2/40 px-3 py-2.5 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className={item.status === ProgressStatus.OVERDUE ? "text-sm text-danger" : "text-sm text-fg"}>
                          {item.row.name}
                        </p>
                        <ItemDetails row={{ ...item.row, links: [], comments: "" }} status={item.status} />
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Check className="size-3.5" />}
                        onClick={() => setConfirm(item)}
                        className="self-end sm:self-auto"
                      >
                        Mark done
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirm !== null}
        title="Mark as completed?"
        confirmLabel="Mark done"
        message={
          <>
            <span className="font-medium text-fg">{confirm?.row.name}</span> will be marked completed today.
          </>
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) void (confirm.domain === "IT" ? it : bcs).setStatus(confirm.row, ProgressStatus.COMPLETED);
          setConfirm(null);
        }}
      />
    </>
  );
}
