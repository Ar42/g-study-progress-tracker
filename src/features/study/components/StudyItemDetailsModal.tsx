import { Pencil } from "lucide-react";
import { Button, Modal } from "../../../components/ui";
import type { DisplayStatus } from "../../../enums/progress";
import type { StudyRow } from "../../../types";
import { visibleUnits } from "../../../lib/units";
import { ItemDetails } from "./ItemDetails";
import { StatusTag } from "./StatusVisual";
import { UnitProgress } from "./UnitProgress";

export interface StudyItemDetailsTarget {
  readonly row: StudyRow;
  readonly status: DisplayStatus;
  /** e.g. the subject name for a BCS chapter. */
  readonly context?: string;
}

function Section({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">{title}</h3>
      {children}
    </section>
  );
}

/** Read-only view of everything about a chapter / topic. Scrolls inside (max ~90% of the screen). */
export function StudyItemDetailsModal({
  target,
  onClose,
  onEdit,
}: {
  readonly target: StudyItemDetailsTarget | null;
  readonly onClose: () => void;
  readonly onEdit?: () => void;
}) {
  if (!target) return null;
  const { row, status, context } = target;
  const hasUnits = visibleUnits(row.units).length > 0;
  const hasDetails = Boolean(row.startedDate || row.targetDate || row.completedDate || row.comments || row.links.length);

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={row.name}
      description={
        <span className="inline-flex flex-wrap items-center gap-2">
          <StatusTag status={status} />
          {context && <span>{context}</span>}
          {row.preliMarks && <span className="font-numbers">{row.preliMarks} marks</span>}
        </span>
      }
      footer={
        onEdit && (
          <Button
            variant="secondary"
            icon={<Pencil className="size-4" />}
            onClick={() => {
              onClose();
              onEdit();
            }}
          >
            Edit
          </Button>
        )
      }
    >
      <div className="space-y-6">
        {hasUnits && (
          <Section title="Progress">
            <UnitProgress units={row.units} />
          </Section>
        )}
        {hasDetails && (
          <Section title="Details">
            <ItemDetails row={row} status={status} />
          </Section>
        )}
        {!hasUnits && !hasDetails && <p className="text-sm text-fg-subtle">Nothing added yet. Use Edit to add dates, notes, links or progress units.</p>}
      </div>
    </Modal>
  );
}
