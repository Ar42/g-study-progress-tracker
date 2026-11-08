import { useState } from "react";
import { Button, DurationInput, Field, Modal } from "../../../components/ui";
import { formatMinutes, parseDuration } from "../../../lib/duration";
import { useSettings } from "../hooks/useSettings";

const asText = (m: number) => (m > 0 ? String(m) : "");

/** Daily / weekly study targets and the "confirm long sessions" threshold. */
export function TargetsModal({ onClose }: { readonly onClose: () => void }) {
  const { settings, save } = useSettings();
  const [daily, setDaily] = useState(asText(settings.dailyTargetMinutes));
  const [weekly, setWeekly] = useState(asText(settings.weeklyTargetMinutes));
  const [confirmOver, setConfirmOver] = useState(asText(settings.confirmSessionOverMinutes));
  const [submitted, setSubmitted] = useState(false);

  const parse = (text: string, max: number, required = false): { minutes: number } | { error: string } => {
    if (!text.trim()) return required ? { error: "Required" } : { minutes: 0 };
    const p = parseDuration(text);
    if (!p.ok) return { error: p.error };
    if (p.minutes > max) return { error: `At most ${formatMinutes(max)}` };
    return { minutes: p.minutes };
  };
  const d = parse(daily, 24 * 60);
  const w = parse(weekly, 7 * 24 * 60);
  const c = parse(confirmOver, 24 * 60, true);
  const dailyMin = "minutes" in d ? d.minutes : 0;

  const submit = async () => {
    setSubmitted(true);
    if ("error" in d || "error" in w || "error" in c) return;
    const ok = await save({ dailyTargetMinutes: d.minutes, weeklyTargetMinutes: w.minutes, confirmSessionOverMinutes: c.minutes });
    if (ok) onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Study targets"
      description="Synced through your sheet, so they're the same on every device."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Save targets</Button>
        </>
      }
    >
      <form
        className="space-y-5"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Field label="Daily target" htmlFor="t-daily" error={submitted && "error" in d ? d.error : undefined} hint="Leave empty for no daily target.">
          <DurationInput id="t-daily" value={daily} onChange={setDaily} presets={[60, 120, 180, 240]} />
        </Field>

        <Field
          label="Weekly target (Sat – Fri)"
          htmlFor="t-weekly"
          error={submitted && "error" in w ? w.error : undefined}
          hint={!weekly.trim() && dailyMin > 0 ? `Empty = daily × 7 (${formatMinutes(dailyMin * 7)}).` : "A bit under daily × 7 leaves room for a rest day."}
        >
          <div className="flex flex-wrap items-center gap-2">
            <DurationInput id="t-weekly" value={weekly} onChange={setWeekly} presets={[]} />
            {dailyMin > 0 && (
              <Button variant="soft" size="sm" onClick={() => setWeekly(String(Math.round(dailyMin * 7)))}>
                Use daily × 7
              </Button>
            )}
            {dailyMin > 0 && (
              <Button variant="soft" size="sm" onClick={() => setWeekly(String(Math.round(dailyMin * 6)))}>
                Daily × 6 (1 rest day)
              </Button>
            )}
          </div>
        </Field>

        <Field
          label="Ask me to confirm sessions longer than"
          htmlFor="t-confirm"
          required
          error={submitted && "error" in c ? c.error : undefined}
          hint="If you forget to pause, finishing a longer session asks you to confirm or correct the time."
        >
          <DurationInput id="t-confirm" value={confirmOver} onChange={setConfirmOver} presets={[120, 180, 240, 360]} />
        </Field>

        <div className="rounded-lg border border-border bg-surface-2/50 px-3.5 py-3 text-xs leading-relaxed text-fg-muted">
          Ratings: <span className="font-semibold text-success">100%+ Target met</span> ·{" "}
          <span className="font-semibold text-primary">80–99% Good</span> · <span className="font-semibold text-warning">50–79% Poor</span> ·{" "}
          <span className="font-semibold text-danger">under 50% Bad</span>. Past weeks are rated against your current targets.
        </div>
      </form>
    </Modal>
  );
}
