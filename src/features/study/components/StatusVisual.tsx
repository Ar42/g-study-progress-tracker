import { AlertTriangle, CheckCircle2, CircleDashed, Clock } from "lucide-react";
import { Badge } from "../../../components/ui";
import { cn } from "../../../lib/cn";
import { STATUS_META, type DisplayStatus } from "../../../enums/progress";
import { STATUS_ROW } from "../statusStyles";

const ICONS = {
  IN_PROGRESS: Clock,
  OVERDUE: AlertTriangle,
  COMPLETED: CheckCircle2,
  NOT_STARTED: CircleDashed,
} as const;

export function StatusIcon({ status, className }: { readonly status: DisplayStatus; readonly className?: string }) {
  const Icon = ICONS[status];
  return <Icon aria-label={STATUS_META[status].label} className={cn("size-4 shrink-0", STATUS_ROW[status].icon, className)} />;
}

/** Inline label shown only for rows that need attention (in progress / overdue). */
export function StatusTag({ status }: { readonly status: DisplayStatus }) {
  if (status === "IN_PROGRESS") {
    return (
      <Badge tone="info" dot className="align-middle">
        In progress
      </Badge>
    );
  }
  if (status === "OVERDUE") {
    return (
      <Badge tone="danger" dot className="align-middle">
        Overdue
      </Badge>
    );
  }
  return null;
}
