import { NavLink, useLocation } from "react-router-dom";
import { BarChart3, Code2, LayoutDashboard, Menu, NotebookPen } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/** Thumb-reachable tab bar for phones; "Menu" opens the full sidebar (subjects, notes, all reports). */
export function MobileNav({ onOpenMenu }: { readonly onOpenMenu: () => void }) {
  const { pathname } = useLocation();
  // Pages without their own tab are reached through the menu, so it shows as active there.
  const inMenuOnly = ["/subject/", "/notes", "/drive"].some((p) => pathname.startsWith(p));

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
      {tab("/log", "Log", <NotebookPen />)}
      {tab("/it", "IT", <Code2 />)}
      {tab("/reports/bcs", "Reports", <BarChart3 />, { prefix: "/reports" })}
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className={cn(
          "flex flex-1 cursor-pointer flex-col items-center gap-1 py-2 text-[11px] font-semibold [&_svg]:size-5",
          inMenuOnly ? "text-primary" : "text-fg-subtle",
        )}
      >
        <Menu />
        Menu
      </button>
    </nav>
  );
}
