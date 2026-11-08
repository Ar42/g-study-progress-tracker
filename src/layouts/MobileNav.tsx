import { NavLink, useLocation } from "react-router-dom";
import { BarChart3, BookOpen, Code2, LayoutDashboard, NotebookPen } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/** Thumb-reachable tab bar for phones; "Subjects" opens the full menu. */
export function MobileNav({ onOpenMenu }: { readonly onOpenMenu: () => void }) {
  const { pathname } = useLocation();
  const onSubject = pathname.startsWith("/subject/");

  const tab = (to: string, label: string, icon: ReactNode, opts: { end?: boolean; prefix?: string } = {}) => (
    <NavLink
      to={to}
      end={opts.end}
      className={({ isActive }) =>
        cn(
          "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold transition-colors [&_svg]:size-5",
          isActive || (opts.prefix && pathname.startsWith(opts.prefix)) ? "text-primary" : "text-fg-subtle",
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      {tab("/", "Home", <LayoutDashboard />, { end: true })}
      <button
        type="button"
        onClick={onOpenMenu}
        className={cn(
          "flex flex-1 cursor-pointer flex-col items-center gap-1 py-2 text-[11px] font-semibold [&_svg]:size-5",
          onSubject ? "text-primary" : "text-fg-subtle",
        )}
      >
        <BookOpen />
        Subjects
      </button>
      {tab("/log", "Log", <NotebookPen />)}
      {tab("/it", "IT", <Code2 />)}
      {tab("/reports/bcs", "Reports", <BarChart3 />, { prefix: "/reports" })}
    </nav>
  );
}
