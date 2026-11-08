import { useLocation } from "react-router-dom";
import { cn } from "../../../lib/cn";
import { useActiveSession } from "../hooks/useActiveSession";
import { useTimerTitle } from "../hooks/useTimerTitle";
import { SessionControls } from "./SessionControls";

/**
 * Floating "mini player" for the active session, on every page except the
 * Study Log (which shows the full card). Above the bottom tab bar on phones,
 * bottom-right on desktop.
 */
export function TimerDock() {
  const { session } = useActiveSession();
  const { pathname } = useLocation();
  useTimerTitle();
  if (!session || pathname === "/log") return null;

  return (
    <aside
      aria-label="Study timer"
      className={cn(
        "fixed z-30 animate-scale-in rounded-2xl border border-border bg-surface/95 p-4 shadow-pop backdrop-blur-xl",
        "inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-96",
      )}
    >
      <SessionControls />
    </aside>
  );
}
