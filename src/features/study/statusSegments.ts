import type { StatusSegment } from "../../components/ui";
import { STATUS_META, type DisplayStatus } from "../../enums/progress";

const ORDER: readonly DisplayStatus[] = ["COMPLETED", "IN_PROGRESS", "OVERDUE", "NOT_STARTED"];

/** Status counts → ordered segments for <StatusBar>. */
export function statusSegments(counts: Record<DisplayStatus, number>): StatusSegment[] {
  return ORDER.map((s) => ({ key: s, label: STATUS_META[s].label, value: counts[s], tone: STATUS_META[s].tone }));
}
