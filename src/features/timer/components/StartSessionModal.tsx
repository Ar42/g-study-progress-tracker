import { useState } from "react";
import { Play } from "lucide-react";
import { Button, Field, Input, Modal, Textarea } from "../../../components/ui";
import { ProgressStatus } from "../../../enums/progress";
import { cn } from "../../../lib/cn";
import { TopicPicker } from "../../study/components/TopicPicker";
import { useStudyActions } from "../../study/hooks/useStudyActions";
import { EMPTY_CHOICE, useTopicTarget, validateTopicChoice, type TopicChoice, type TopicErrors } from "../../study/hooks/useTopicChoice";
import { useActiveSession } from "../hooks/useActiveSession";
import { useNow } from "../hooks/useNow";

const AGO_OPTIONS = [0, 5, 10, 15, 30] as const;
const MAX_BACKDATE_MS = 24 * 60 * 60 * 1000;

/** "yyyy-MM-ddTHH:mm" in local time, for <input type="datetime-local">. */
function toLocalInput(ms: number): string {
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}

export interface StartSessionModalProps {
  readonly mode: "start" | "edit";
  readonly preset?: TopicChoice;
  readonly onClose: () => void;
}

/** Start a timer (or edit the running one's topic/note). */
export function StartSessionModal({ mode, preset, onClose }: StartSessionModalProps) {
  const { session, start, updateDetails } = useActiveSession();
  const bcsActions = useStudyActions("BCS");
  const itActions = useStudyActions("IT");

  const editing = mode === "edit" && session;
  const [choice, setChoice] = useState<TopicChoice>(
    editing
      ? { category: session.category, subjectId: session.subjectId, topicId: session.topicId }
      : (preset ?? EMPTY_CHOICE),
  );
  const [note, setNote] = useState(editing ? session.note : "");
  const [ago, setAgo] = useState<number | "custom">(0);
  const [custom, setCustom] = useState(() => toLocalInput(Date.now()));
  const [markActive, setMarkActive] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const target = useTopicTarget(choice);
  const now = useNow(true, 15_000);

  const customMs = new Date(custom).getTime();
  const startError =
    ago === "custom"
      ? Number.isNaN(customMs)
        ? "Pick a valid time"
        : customMs > now + 60_000
          ? "Start time can't be in the future"
          : now - customMs > MAX_BACKDATE_MS
            ? "Use “Log manually” for study more than 24 hours ago"
            : undefined
      : undefined;

  const errors: TopicErrors & { start?: string } = submitted ? { ...validateTopicChoice(choice), start: startError } : {};

  const submit = () => {
    setSubmitted(true);
    if (Object.values(validateTopicChoice(choice)).some(Boolean) || startError) return;
    // Names: prefer the live row, fall back to what the session had (topic may have been deleted).
    const names = {
      subjectName: target.subjectName || (editing ? session.subjectName : ""),
      topicName: target.topicName || (editing ? session.topicName : ""),
    };
    onClose();
    if (editing) {
      void updateDetails({
        category: choice.category,
        subjectId: choice.category === "BCS" ? choice.subjectId : "",
        topicId: choice.topicId,
        note: note.trim(),
        ...names,
      });
      return;
    }
    const startedAt = ago === "custom" ? customMs : Date.now() - ago * 60_000;
    const mark = markActive && target.canMark ? target.row : null;
    const setStatus = (choice.category === "IT" ? itActions : bcsActions).setStatus;
    void (async () => {
      const ok = await start({ choice, ...names, note, startedAt });
      if (ok && mark) await setStatus(mark, ProgressStatus.IN_PROGRESS);
    })();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={editing ? "Edit session" : "Start studying"}
      description={editing ? "Change what this session is for. The time is kept." : "The timer keeps running even if you close the app."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button icon={editing ? undefined : <Play className="size-4" />} onClick={submit}>
            {editing ? "Save" : "Start timer"}
          </Button>
        </>
      }
    >
      <form
        className="space-y-5"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <TopicPicker
          idPrefix="ses"
          value={choice}
          onChange={setChoice}
          errors={errors}
          markActive={markActive}
          onMarkActiveChange={editing ? undefined : setMarkActive}
        />

        {!editing && (
          <Field label="Started" error={errors.start} hint="Forgot to press start? Pick when you actually began.">
            <div className="flex flex-wrap items-center gap-2">
              {AGO_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setAgo(m)}
                  className={cn(
                    "h-8 cursor-pointer rounded-lg border px-3 text-xs font-semibold transition-colors",
                    ago === m ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-fg-muted hover:border-border-strong hover:text-fg",
                  )}
                >
                  {m === 0 ? "Now" : `${m} min ago`}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAgo("custom")}
                className={cn(
                  "h-8 cursor-pointer rounded-lg border px-3 text-xs font-semibold transition-colors",
                  ago === "custom" ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-fg-muted hover:border-border-strong hover:text-fg",
                )}
              >
                Custom…
              </button>
              {ago === "custom" && (
                <Input
                  type="datetime-local"
                  value={custom}
                  max={toLocalInput(now)}
                  onChange={(e) => setCustom(e.target.value)}
                  aria-label="Start time"
                  aria-invalid={Boolean(errors.start)}
                  className="w-56"
                />
              )}
            </div>
          </Field>
        )}

        <Field label="Note (optional)" htmlFor="ses-note" hint="Becomes the starting text of the log description when you finish.">
          <Textarea id="ses-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's the plan for this session?" />
        </Field>
      </form>
    </Modal>
  );
}
