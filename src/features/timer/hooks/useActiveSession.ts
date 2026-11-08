import { useCallback } from "react";
import { toast } from "sonner";
import { TIMER_SCRIPT_VERSION } from "../../../config/constants";
import { formatMinutes } from "../../../lib/duration";
import { generateRowId } from "../../../lib/id";
import { closeSegments, isRunning, splitByLocalDay } from "../../../lib/sessionTime";
import { useSyncStatus } from "../../../services/syncStatus";
import {
  useCreateLogMutation,
  useDeleteSessionMutation,
  useGetSessionsQuery,
  useSaveSessionMutation,
} from "../../../services/studyApi";
import type { LogEntry, SessionSegment, StudySession } from "../../../types";
import type { TopicChoice } from "../../study/hooks/useTopicChoice";
import { useTimerUi } from "../timerUi";

const message = (e: unknown) =>
  (typeof e === "object" && e && "message" in e && typeof e.message === "string" && e.message) || "Couldn't save to Google Sheet.";

export interface StartArgs {
  readonly choice: TopicChoice;
  readonly subjectName: string;
  readonly topicName: string;
  readonly note: string;
  /** When studying actually began (ms). Defaults to now. */
  readonly startedAt?: number;
}

/**
 * The single active study session (running or paused) and everything you can
 * do with it. Every change is one row write, so a reload, a long gap or
 * another device sees exactly the same state.
 */
export function useActiveSession() {
  const { data, isLoading } = useGetSessionsQuery();
  const scriptVersion = useSyncStatus((s) => s.scriptVersion);
  const [saveSession] = useSaveSessionMutation();
  const [deleteSession] = useDeleteSessionMutation();
  const [createLog] = useCreateLogMutation();

  const session = data?.sessions[0] ?? null;
  const writable = (scriptVersion ?? 0) >= TIMER_SCRIPT_VERSION;
  const running = session ? isRunning(session.segments) : false;

  const save = useCallback(
    async (next: StudySession, isNew: boolean, failure: string) => {
      try {
        await saveSession({ session: next, isNew }).unwrap();
        return true;
      } catch (e) {
        toast.error(failure, { description: message(e) });
        return false;
      }
    },
    [saveSession],
  );

  const start = useCallback(
    (a: StartArgs) => {
      const startedAt = Math.min(a.startedAt ?? Date.now(), Date.now());
      const next: StudySession = {
        id: generateRowId("ses"),
        category: a.choice.category,
        subjectId: a.choice.category === "BCS" ? a.choice.subjectId : "",
        subjectName: a.choice.category === "BCS" ? a.subjectName : "",
        topicId: a.choice.topicId,
        topicName: a.topicName,
        segments: [{ start: new Date(startedAt).toISOString(), end: null }],
        note: a.note.trim(),
        updatedAt: new Date().toISOString(),
      };
      return save(next, true, "Couldn't start the timer");
    },
    [save],
  );

  const pause = useCallback(() => {
    if (!session || !isRunning(session.segments)) return Promise.resolve(false);
    return save(
      { ...session, segments: closeSegments(session.segments), updatedAt: new Date().toISOString() },
      false,
      "Couldn't pause the timer",
    );
  }, [session, save]);

  const resume = useCallback(() => {
    if (!session || isRunning(session.segments)) return Promise.resolve(false);
    const now = new Date().toISOString();
    return save(
      { ...session, segments: [...session.segments, { start: now, end: null }], updatedAt: now },
      false,
      "Couldn't resume the timer",
    );
  }, [session, save]);

  const updateDetails = useCallback(
    (changes: Pick<StudySession, "category" | "subjectId" | "subjectName" | "topicId" | "topicName" | "note">) => {
      if (!session) return Promise.resolve(false);
      return save({ ...session, ...changes, updatedAt: new Date().toISOString() }, false, "Couldn't update the session");
    },
    [session, save],
  );

  const discard = useCallback(async () => {
    if (!session) return false;
    try {
      await deleteSession(session.id).unwrap();
      toast.success("Session discarded");
      return true;
    } catch (e) {
      toast.error("Couldn't discard the session", { description: message(e) });
      return false;
    }
  }, [session, deleteSession]);

  /**
   * Writes one Study Log entry per local day the (closed) segments cover, then
   * removes the session. Entry ids are `${sessionId}-${date}`, so retrying after
   * a partial failure never creates duplicates. If anything fails, the session
   * stays so you can try again.
   */
  const finish = useCallback(
    async (segments: readonly SessionSegment[], description: string) => {
      if (!session) return false;
      const shares = splitByLocalDay(segments);
      const createdAt = new Date().toISOString();
      try {
        for (const share of shares) {
          const entry: LogEntry = {
            id: `${session.id}-${share.date}`,
            date: share.date,
            category: session.category,
            subjectId: session.subjectId,
            subjectName: session.subjectName,
            topicId: session.topicId,
            topicName: session.topicName,
            minutes: share.minutes,
            description: description.trim(),
            createdAt,
            sessionId: session.id,
          };
          await createLog(entry).unwrap();
        }
        await deleteSession(session.id).unwrap();
      } catch (e) {
        toast.error("Couldn't finish the session — it's still saved, try again", { description: message(e) });
        return false;
      }
      const total = shares.reduce((n, s) => n + s.minutes, 0);
      toast.success(`Logged ${formatMinutes(total)}`, {
        description: shares.length > 1 ? `Split across ${shares.length} days: ${shares.map((s) => formatMinutes(s.minutes)).join(" + ")}` : undefined,
      });
      return true;
    },
    [session, createLog, deleteSession],
  );

  return { session, isLoading, writable, running, start, pause, resume, updateDetails, discard, finish };
}

/** Opens the start dialog — or explains why it can't. */
export function useStartTimer() {
  const { session, writable } = useActiveSession();
  const open = useTimerUi((s) => s.open);
  return useCallback(
    (preset?: TopicChoice) => {
      if (!writable) {
        toast.error("Update Code.gs to use the study timer", {
          description: "Paste the latest Code.gs into Apps Script and deploy a new version.",
        });
        return;
      }
      open(session ? { kind: "busy" } : { kind: "start", preset });
    },
    [session, writable, open],
  );
}
