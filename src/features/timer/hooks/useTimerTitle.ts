import { useEffect } from "react";
import { formatClock } from "../../../lib/duration";
import { elapsedMs } from "../../../lib/sessionTime";
import { useActiveSession } from "./useActiveSession";
import { useNow } from "./useNow";

/** Puts the running clock in the browser tab title. */
export function useTimerTitle() {
  const { session, running } = useActiveSession();
  const now = useNow(running);
  const label = session ? `${running ? "▶" : "❚❚"} ${formatClock(elapsedMs(session.segments, now))}` : null;
  useEffect(() => {
    const base = document.title.replace(/^(▶|❚❚) [\d:]+ · /, "");
    document.title = label ? `${label} · ${base}` : base;
  }, [label]);
}
