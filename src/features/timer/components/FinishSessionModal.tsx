import { useMemo, useState } from "react";
import { format } from "date-fns";
import { AlertTriangle, CalendarDays, Check } from "lucide-react";
import { Badge, Button, DurationInput, Field, MarkdownEditor, Modal } from "../../../components/ui";
import { cn } from "../../../lib/cn";
import { formatMinutes, parseDuration } from "../../../lib/duration";
import { closeSegments, elapsedMs, splitByLocalDay, truncateToMinutes } from "../../../lib/sessionTime";
import { useSettings } from "../../targets/hooks/useSettings";
import { useActiveSession } from "../hooks/useActiveSession";

type LongChoice = "keep" | "correct" | null;

const time = (iso: string) => format(new Date(iso), "h:mm a");
const day = (iso: string) => format(new Date(`${iso}T00:00:00`), "EEE, d MMM");

/**
 * Finishing a session: freezes the clock at the moment you clicked Finish,
 * shows exactly how the time will be logged (split per day), and for unusually
 * long sessions makes you confirm or correct the total first.
 */
export function FinishSessionModal({ onClose }: { readonly onClose: () => void }) {
  const { session, finish, discard } = useActiveSession();
  const { settings } = useSettings();
  const [frozenAt] = useState(() => Date.now());
  const [description, setDescription] = useState(session?.note ?? "");
  const [longChoice, setLongChoice] = useState<LongChoice>(null);
  const [correction, setCorrection] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const closed = useMemo(() => (session ? closeSegments(session.segments, frozenAt) : []), [session, frozenAt]);
  const totalMin = elapsedMs(closed, frozenAt) / 60000;
  const threshold = settings.confirmSessionOverMinutes;
  const isLong = totalMin > threshold;
  const tooShort = totalMin < 1;

  const parsedCorrection = correction.trim() ? parseDuration(correction) : null;
  const correctionError =
    longChoice === "correct"
      ? !parsedCorrection
        ? "Enter how long you actually studied"
        : !parsedCorrection.ok
          ? parsedCorrection.error
          : parsedCorrection.minutes > totalMin
            ? `Can't be more than the timed ${formatMinutes(totalMin)}`
            : undefined
      : undefined;

  const finalSegments = useMemo(() => {
    if (isLong && longChoice === "correct" && parsedCorrection?.ok && !correctionError) {
      return truncateToMinutes(closed, parsedCorrection.minutes, frozenAt);
    }
    return closed;
  }, [isLong, longChoice, parsedCorrection, correctionError, closed, frozenAt]);
  const shares = splitByLocalDay(finalSegments, frozenAt);
  const finalTotal = shares.reduce((n, s) => n + s.minutes, 0);

  if (!session) return null;

  const descError = submitted && !description.trim() ? "Write what you studied" : undefined;
  const longError = submitted && isLong && !longChoice ? "Confirm the time or correct it" : undefined;

  const save = async () => {
    setSubmitted(true);
    if (!description.trim() || (isLong && (!longChoice || correctionError)) || tooShort || shares.length === 0) return;
    setBusy(true);
    const ok = await finish(finalSegments, description);
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      dismissible={!busy}
      title="Finish session"
      description={
        <>
          {session.subjectName && <>{session.subjectName} › </>}
          <span className="font-medium text-fg">{session.topicName}</span>
        </>
      }
      footer={
        tooShort ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              Keep timing
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (await discard()) onClose();
              }}
            >
              Discard session
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              Keep timing
            </Button>
            <Button icon={<Check className="size-4" />} onClick={save} loading={busy}>
              Save {formatMinutes(finalTotal)} to log
            </Button>
          </>
        )
      }
    >
      {tooShort ? (
        <p className="text-sm text-fg-muted">
          This session is shorter than a minute, so there's nothing worth logging. Keep timing, or discard it.
        </p>
      ) : (
        <div className="space-y-5">
          {/* What will be logged */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Will be logged as</h3>
            <ul className="divide-y divide-border rounded-xl border border-border">
              {shares.map((s) => (
                <li key={s.date} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                  <span className="flex items-center gap-2 text-fg-muted">
                    <CalendarDays className="size-4 text-fg-subtle" />
                    {day(s.date)}
                  </span>
                  <span className="font-numbers text-fg">{formatMinutes(s.minutes)}</span>
                </li>
              ))}
            </ul>
            {shares.length > 1 && (
              <p className="text-xs text-fg-subtle">This session crossed midnight, so it's split into one log entry per day.</p>
            )}
            <details className="text-xs text-fg-subtle">
              <summary className="cursor-pointer select-none hover:text-fg">
                Timeline · {closed.length} {closed.length === 1 ? "stretch" : "stretches"} (pauses excluded)
              </summary>
              <ul className="mt-2 space-y-1 pl-1">
                {closed.map((seg, i) => (
                  <li key={i} className="font-numbers">
                    {time(seg.start)} – {time(seg.end!)} · {formatMinutes(elapsedMs([seg]) / 60000)}
                  </li>
                ))}
              </ul>
            </details>
          </section>

          {/* Forgot to pause? */}
          {isLong && (
            <section
              className={cn(
                "space-y-3 rounded-xl border p-4",
                longError ? "border-danger/50 bg-danger-soft" : "border-warning/30 bg-warning-soft",
              )}
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                <div className="text-sm">
                  <p className="font-semibold text-fg">That's {formatMinutes(totalMin)} — did you forget to pause?</p>
                  <p className="text-fg-muted">Sessions over {formatMinutes(threshold)} need a quick check before they're logged.</p>
                </div>
              </div>
              <div className="space-y-2 pl-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-fg">
                  <input
                    type="radio"
                    name="long"
                    checked={longChoice === "keep"}
                    onChange={() => setLongChoice("keep")}
                    className="accent-(--c-primary)"
                  />
                  Yes, I really studied {formatMinutes(totalMin)}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-fg">
                  <input
                    type="radio"
                    name="long"
                    checked={longChoice === "correct"}
                    onChange={() => setLongChoice("correct")}
                    className="accent-(--c-primary)"
                  />
                  No — I actually studied:
                </label>
                {longChoice === "correct" && (
                  <Field label="Actual time" htmlFor="fin-correct" error={submitted ? correctionError : undefined} hint="The extra time at the end is dropped.">
                    <DurationInput
                      id="fin-correct"
                      value={correction}
                      onChange={setCorrection}
                      invalid={submitted && Boolean(correctionError)}
                      presets={[]}
                    />
                  </Field>
                )}
                {longError && <p className="text-xs text-danger">{longError}</p>}
              </div>
            </section>
          )}

          <Field label="What did you study?" htmlFor="fin-desc" required error={descError}>
            <MarkdownEditor
              id="fin-desc"
              value={description}
              onChange={setDescription}
              invalid={Boolean(descError)}
              rows={6}
              placeholder={"## Covered\n- Key point one\n- Key point two"}
            />
          </Field>

          {shares.length > 1 && (
            <p className="flex items-center gap-2 text-xs text-fg-subtle">
              <Badge tone="neutral">{shares.length} entries</Badge> The same description is used for each day.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
