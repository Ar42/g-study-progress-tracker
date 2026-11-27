import { BarChart3, Plus, Trash2 } from "lucide-react";
import { Button, IconButton, Input } from "../../../components/ui";
import type { UnitDraft, UnitsDraft } from "../hooks/useUnitsDraft";

/**
 * Progress units of the chosen chapter/topic, pre-filled with what's saved.
 * Used when logging study and when finishing a timer session.
 */
export function UnitsEditor({ units, showErrors }: { readonly units: UnitsDraft; readonly showErrors: boolean }) {
  if (!units.hasRow) return null;
  const { draft, setDraft, errors, writable } = units;
  const patch = (i: number, p: Partial<UnitDraft>) => setDraft(draft.map((d, j) => (j === i ? { ...d, ...p } : d)));

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Progress units</h3>
          <p className="text-xs text-fg-subtle">Update how far you got, e.g. videos watched.</p>
        </div>
        <Button
          size="sm"
          variant="soft"
          icon={<Plus className="size-3.5" />}
          disabled={!writable}
          onClick={() => setDraft([...draft, { unit: draft.length === 0 ? "video" : "", total: "", finished: "" }])}
        >
          Add unit
        </Button>
      </div>

      {!writable ? (
        <p className="rounded-lg border border-warning/30 bg-warning-soft px-3 py-2.5 text-xs text-fg-muted">
          Progress units need the latest Code.gs (v7). Paste it into Apps Script and deploy a new version to use them.
        </p>
      ) : draft.length === 0 ? (
        <p className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-xs text-fg-subtle">
          <BarChart3 className="size-3.5" /> No units for this topic yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {draft.map((d, i) => {
            const e = showErrors ? errors[i] : {};
            return (
              <li key={i} className="flex items-start gap-2 rounded-lg border border-border bg-surface-2/50 p-3">
                <div className="grid flex-1 grid-cols-3 gap-2">
                  <Input placeholder="Unit (video)" aria-label="Unit" value={d.unit} onChange={(ev) => patch(i, { unit: ev.target.value })} />
                  <div>
                    <Input
                      placeholder="Finished"
                      aria-label="Finished"
                      inputMode="numeric"
                      value={d.finished}
                      aria-invalid={Boolean(e.finished)}
                      onChange={(ev) => patch(i, { finished: ev.target.value })}
                    />
                    {e.finished && <p className="mt-1 text-xs text-danger">{e.finished}</p>}
                  </div>
                  <div>
                    <Input
                      placeholder="Total"
                      aria-label="Total"
                      inputMode="numeric"
                      value={d.total}
                      aria-invalid={Boolean(e.total)}
                      onChange={(ev) => patch(i, { total: ev.target.value })}
                    />
                    {e.total && <p className="mt-1 text-xs text-danger">{e.total}</p>}
                  </div>
                </div>
                <IconButton label="Remove unit" tone="danger" icon={<Trash2 />} onClick={() => setDraft(draft.filter((_, j) => j !== i))} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
