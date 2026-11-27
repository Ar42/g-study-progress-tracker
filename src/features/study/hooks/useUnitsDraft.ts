import { useCallback, useMemo, useState } from "react";
import { UNITS_SCRIPT_VERSION } from "../../../config/constants";
import { useSyncStatus } from "../../../services/syncStatus";
import type { ProgressUnit, StudyRow } from "../../../types";

/** One editable unit row (strings, as typed). */
export interface UnitDraft {
  readonly unit: string;
  readonly total: string;
  readonly finished: string;
}

export interface UnitDraftError {
  readonly total?: string;
  readonly finished?: string;
}

const toDraft = (units: readonly ProgressUnit[]): UnitDraft[] =>
  units.map((u) => ({ unit: u.unit, total: u.total ? String(u.total) : "", finished: u.finished ? String(u.finished) : "" }));

function validate(d: UnitDraft): UnitDraftError {
  const total = d.total.trim();
  const finished = d.finished.trim();
  let totalError: string | undefined;
  let finishedError: string | undefined;
  if (!/^\d*$/.test(total)) totalError = "Whole number";
  else if (!total || Number(total) < 1) totalError = "Enter the total";
  if (!/^\d*$/.test(finished)) finishedError = "Whole number";
  else if (!totalError && Number(finished || 0) > Number(total)) finishedError = "More than the total";
  return { total: totalError, finished: finishedError };
}

/**
 * Editable copy of a chapter/topic's progress units, pre-filled from the row and
 * reset whenever a different row is chosen. Nothing is written by this hook: the
 * caller saves `withUnits(row)`, which only differs from `row` when the user
 * actually changed something.
 */
export function useUnitsDraft(row: StudyRow | null) {
  const [state, setState] = useState<{ id: string; draft: UnitDraft[] } | null>(null);
  const scriptVersion = useSyncStatus((s) => s.scriptVersion);
  const writable = (scriptVersion ?? 0) >= UNITS_SCRIPT_VERSION;

  const touched = Boolean(row && state && state.id === row.id);
  const draft = useMemo(() => (touched && state ? state.draft : row ? toDraft(row.units) : []), [touched, state, row]);
  const errors = useMemo(() => draft.map(validate), [draft]);
  const valid = errors.every((e) => !e.total && !e.finished);
  const units = useMemo<ProgressUnit[]>(
    () => draft.map((d) => ({ unit: d.unit.trim(), total: Number(d.total) || 0, finished: Number(d.finished) || 0 })),
    [draft],
  );
  const changed = Boolean(row && touched && JSON.stringify(units) !== JSON.stringify(row.units));

  const setDraft = useCallback(
    (next: UnitDraft[]) => {
      if (row) setState({ id: row.id, draft: next });
    },
    [row],
  );

  /** The row with the edited units applied (the same row when nothing was edited). */
  const withUnits = useCallback(
    (r: StudyRow): StudyRow => (changed && valid ? { ...r, units, unitsRaw: null } : r),
    [changed, valid, units],
  );

  return { draft, setDraft, errors, valid, changed, writable, withUnits, hasRow: Boolean(row) };
}

export type UnitsDraft = ReturnType<typeof useUnitsDraft>;
