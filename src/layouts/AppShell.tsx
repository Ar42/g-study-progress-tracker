import { useCallback, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button, Spinner } from "../components/ui";
import { useSubjects } from "../features/study/hooks/useStudyData";
import { useBcsRows, useItRows } from "../features/study/hooks/useStudyData";
import { logout } from "../features/auth/session";
import { useSyncStatus } from "../services/syncStatus";
import { FOCUS_REFRESH_AFTER_MS } from "../config/constants";
import { Brand, Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";
import { SyncIndicator } from "./SyncIndicator";

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const bcs = useBcsRows();
  const it = useItRows();
  const { subjects } = useSubjects();
  const fetching = bcs.isFetching || it.isFetching;
  const { refetch: refetchBcs } = bcs;
  const { refetch: refetchIt } = it;

  const sync = useCallback(() => {
    void refetchBcs();
    void refetchIt();
  }, [refetchBcs, refetchIt]);

  // Pick up changes made elsewhere (phone, the sheet itself) when coming back to the tab.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const { pending, lastSyncedAt } = useSyncStatus.getState();
      if (pending === 0 && Date.now() - lastSyncedAt > FOCUS_REFRESH_AFTER_MS) sync();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [sync]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  let body;
  if (bcs.isLoading) {
    body = (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-fg-subtle">
        <Spinner className="size-6 text-primary" />
        <p className="text-sm">Loading your progress from Google Sheets…</p>
      </div>
    );
  } else if (bcs.error && !bcs.data) {
    const message = "message" in bcs.error ? String(bcs.error.message) : "Unknown error";
    body = (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-11 items-center justify-center rounded-xl bg-danger-soft text-danger">
          <AlertTriangle className="size-5" />
        </div>
        <div className="space-y-1">
          <h2 className="font-semibold text-fg">Couldn't reach your sheet</h2>
          <p className="max-w-sm text-sm text-fg-subtle">{message}</p>
        </div>
        <Button onClick={sync} loading={fetching}>
          Try again
        </Button>
      </div>
    );
  } else {
    body = <Outlet />;
  }

  return (
    <div className="min-h-dvh">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={handleLogout} subjects={subjects} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-bg/75 px-4 backdrop-blur-xl sm:px-6 lg:border-transparent lg:bg-transparent lg:backdrop-blur-none">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <SyncIndicator fetching={fetching} onSync={sync} />
            <ThemeToggle className="lg:hidden" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pt-4 pb-28 sm:px-6 lg:pt-2 lg:pb-12">{body}</main>
      </div>

      <MobileNav onOpenMenu={() => setMenuOpen(true)} />
    </div>
  );
}
