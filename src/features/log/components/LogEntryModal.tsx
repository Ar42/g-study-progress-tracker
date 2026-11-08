import { useState } from "react";
import { Button, DateInput, DurationInput, Field, MarkdownEditor, Modal } from "../../../components/ui";
import { ProgressStatus } from "../../../enums/progress";
import { generateRowId } from "../../../lib/id";
import { todayISO } from "../../../lib/date";
import { parseDuration } from "../../../lib/duration";
import type { LogEntry } from "../../../types";
import { TopicPicker } from "../../study/components/TopicPicker";
import { useStudyActions } from "../../study/hooks/useStudyActions";
import { useTopicTarget, validateTopicChoice, type TopicChoice, type TopicErrors } from "../../study/hooks/useTopicChoice";
import { useLogActions } from "../hooks/useLog";

export interface LogEditorState {
  readonly mode: "create" | "edit";
  readonly entry?: LogEntry;
}

interface Errors extends TopicErrors {
  date?: string;
  minutes?: string;
  description?: string;
}

const MAX_MINUTES_PER_ENTRY = 24 * 60;

export function LogEntryModal({ state, onClose }: { readonly state: LogEditorState; readonly onClose: () => void }) {
  const log = useLogActions();
  const bcsActions = useStudyActions("BCS");
  const itActions = useStudyActions("IT");

  const initial = state.entry;
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [choice, setChoice] = useState<TopicChoice>({
    category: initial?.category ?? "BCS",
    subjectId: initial?.subjectId ?? "",
    topicId: initial?.topicId ?? "",
  });
  const [minutes, setMinutes] = useState(initial?.minutes ? String(initial.minutes) : "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [markActive, setMarkActive] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const target = useTopicTarget(choice);

  const validate = (): Errors => {
    const e: Errors = validateTopicChoice(choice);
    if (!date) e.date = "Pick the date you studied";
    else if (date > todayISO()) e.date = "Date can't be in the future";
    if (minutes.trim()) {
      const p = parseDuration(minutes);
      if (!p.ok) e.minutes = p.error;
      else if (p.minutes > MAX_MINUTES_PER_ENTRY) e.minutes = "More than 24 hours in one day — check the time";
    }
    if (!description.trim()) e.description = "Write what you studied";
    return e;
  };

  // Validate live once the user has tried to save, so errors clear as they fix them.
  const shownErrors: Errors = submitted ? validate() : {};

  const submit = () => {
    setSubmitted(true);
    if (Object.keys(validate()).length > 0) return;

    const parsed = minutes.trim() ? parseDuration(minutes) : null;
    const entry: LogEntry = {
      id: initial?.id ?? generateRowId("log"),
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      sessionId: initial?.sessionId ?? "",
      date,
      category: choice.category,
      subjectId: choice.category === "BCS" ? choice.subjectId : "",
      subjectName: choice.category === "BCS" ? target.subjectName : "",
      topicId: choice.topicId,
      topicName: target.topicName,
      minutes: parsed?.ok ? parsed.minutes : null,
      description: description.trim(),
    };

    const mark = markActive && target.canMark ? target.row : null;
    const setStatus = (choice.category === "IT" ? itActions : bcsActions).setStatus;
    onClose();
    void (async () => {
      const saved = await (state.mode === "create" ? log.create(entry) : log.update(entry));
      // Only touch the topic's progress once the log entry is safely saved.
      if (saved && mark) await setStatus(mark, ProgressStatus.IN_PROGRESS);
    })();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={state.mode === "create" ? "Log study" : "Edit log entry"}
      description="What did you study, and when?"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>{state.mode === "create" ? "Save log" : "Save changes"}</Button>
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
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            submit();
          }
        }}
      >
        <Field label="Date" htmlFor="log-date" required error={shownErrors.date} className="sm:w-1/2">
          <DateInput
            id="log-date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={Boolean(shownErrors.date)}
          />
        </Field>

        <TopicPicker
          idPrefix="log"
          value={choice}
          onChange={setChoice}
          errors={shownErrors}
          markActive={markActive}
          onMarkActiveChange={setMarkActive}
        />

        <Field label="What did you study?" htmlFor="log-desc" required error={shownErrors.description}>
          <MarkdownEditor
            id="log-desc"
            value={description}
            onChange={setDescription}
            invalid={Boolean(shownErrors.description)}
            placeholder={"## Covered\n- Key point one\n- Key point two\n\n## To revise\n- [ ] Something to come back to"}
          />
        </Field>

        <Field
          label="Time spent (optional)"
          htmlFor="log-min"
          error={shownErrors.minutes}
          hint={initial?.sessionId ? "Recorded by the study timer — edit only if it was wrong." : "Minutes (45, 10.5) or 1:30 / 1h 30m"}
        >
          <DurationInput id="log-min" value={minutes} onChange={setMinutes} invalid={Boolean(shownErrors.minutes)} />
        </Field>
      </form>
    </Modal>
  );
}
