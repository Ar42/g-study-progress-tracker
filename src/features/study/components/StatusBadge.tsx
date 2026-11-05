import { Badge } from "../../../components/ui";
import { STATUS_META, type DisplayStatus } from "../../../enums/progress";

export function StatusBadge({ status, className }: { readonly status: DisplayStatus; readonly className?: string }) {
  const meta = STATUS_META[status];
  return (
    <Badge tone={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  );
}
