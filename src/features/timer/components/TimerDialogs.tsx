import { useState } from "react";
import { Button, Modal } from "../../../components/ui";
import { formatClock } from "../../../lib/duration";
import { elapsedMs } from "../../../lib/sessionTime";
import { useActiveSession } from "../hooks/useActiveSession";
import { useTimerUi } from "../timerUi";
import { FinishSessionModal } from "./FinishSessionModal";
import { StartSessionModal } from "./StartSessionModal";

/** All timer dialogs, mounted once (AppShell) and opened via useTimerUi from anywhere. */
export function TimerDialogs() {
  const dialog = useTimerUi((s) => s.dialog);
  const close = useTimerUi((s) => s.close);
  if (!dialog) return null;
  switch (dialog.kind) {
    case "start":
      return <StartSessionModal mode="start" preset={dialog.preset} onClose={close} />;
    case "edit":
      return <StartSessionModal mode="edit" onClose={close} />;
    case "finish":
      return <FinishSessionModal onClose={close} />;
    case "busy":
      return <ActiveSessionDialog onClose={close} />;
  }
}

/** Shown when starting while a session exists, and for "discard". */
function ActiveSessionDialog({ onClose }: { readonly onClose: () => void }) {
  const { session, discard } = useActiveSession();
  const open = useTimerUi((s) => s.open);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [elapsed] = useState(() => (session ? elapsedMs(session.segments) : 0));
  if (!session) return null;

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={confirmDiscard ? "Discard this session?" : "You already have a session"}
      footer={
        confirmDiscard ? (
          <>
            <Button variant="secondary" onClick={() => setConfirmDiscard(false)}>
              Back
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (await discard()) onClose();
              }}
            >
              Discard {formatClock(elapsed)}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" className="text-danger hover:bg-danger-soft hover:text-danger sm:mr-auto" onClick={() => setConfirmDiscard(true)}>
              Discard it
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Keep it
            </Button>
            <Button onClick={() => open({ kind: "finish" })}>Finish & log</Button>
          </>
        )
      }
    >
      <p className="text-sm leading-relaxed text-fg-muted">
        {confirmDiscard ? (
          <>The timed {formatClock(elapsed)} on <span className="font-medium text-fg">{session.topicName}</span> won't be logged. This can't be undone.</>
        ) : (
          <>
            <span className="font-medium text-fg">{session.topicName}</span> has {formatClock(elapsed)} timed. Only one session can run at a
            time — finish it to log the time, or discard it.
          </>
        )}
      </p>
    </Modal>
  );
}
