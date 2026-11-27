import type { ProgressUnit } from "../types";

/** Units worth showing: a name or a total. */
export const visibleUnits = (units: readonly ProgressUnit[]) => units.filter((u) => u.total > 0);

/** 0–100, capped (finished may exceed total if typed that way). */
export function unitPercent(u: ProgressUnit): number {
  if (u.total <= 0) return 0;
  return Math.min(100, Math.round((Math.min(u.finished, u.total) / u.total) * 100));
}

export const unitLabel = (u: ProgressUnit) => u.unit || "Items";
