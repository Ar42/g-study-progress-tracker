import { NavLink } from "react-router-dom";
import { BarChart3, Code2, LayoutDashboard, LogOut, NotebookPen, PieChart, Timer, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { IconButton } from "../components/ui";
import { Logo } from "../components/ui/Logo";
import type { Subject } from "../types";
import { ThemeToggle } from "./ThemeToggle";

interface NavItem {
  readonly to: string;
  readonly label: string;
  readonly icon: ReactNode;
  readonly end?: boolean;
}

const SECTIONS: readonly { title?: string; items: readonly NavItem[] }[] = [
  {
    items: [
      { to: "/", label: "Dashboard", icon: <LayoutDashboard />, end: true },
      { to: "/log", label: "Study log", icon: <NotebookPen /> },
      { to: "/it", label: "IT topics", icon: <Code2 /> },
    ],
  },
  {
    title: "Reports",
    items: [
      { to: "/reports/time", label: "Study time", icon: <Timer /> },
      { to: "/reports/bcs", label: "BCS report", icon: <BarChart3 /> },
      { to: "/reports/it", label: "IT report", icon: <PieChart /> },
    ],
  },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "relative flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors [&_svg]:size-4 [&_svg]:shrink-0",
    isActive
      ? "bg-primary-soft font-semibold text-primary [&_svg]:text-primary"
      : "text-fg-muted hover:bg-surface-2 hover:text-fg",
  );

export function Brand({ onClick }: { readonly onClick?: () => void }) {
  return (
    <NavLink to="/" onClick={onClick} className="flex items-center gap-3">
      <Logo />
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold tracking-tight text-fg">Study Tracker</span>
        <span className="block text-[11px] text-fg-subtle">BCS &amp; IT preparation</span>
      </span>
    </NavLink>
  );
}

export interface SidebarProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onLogout: () => void;
  readonly subjects: readonly Subject[];
}

export function Sidebar({ open, onClose, onLogout, subjects }: SidebarProps) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-overlay backdrop-blur-sm animate-fade-in lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface transition-transform duration-300 ease-out lg:w-64 lg:translate-x-0",
          open ? "translate-x-0 shadow-pop" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Brand onClick={onClose} />
          <IconButton label="Close menu" icon={<X />} onClick={onClose} className="-mr-2 lg:hidden" />
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {SECTIONS.map((section, i) => (
            <div key={section.title ?? i} className="space-y-1">
              {section.title && (
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-subtle">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose} className={linkClass}>
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}

          {subjects.length > 0 && (
            <div className="space-y-1">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-subtle">
                BCS subjects
              </p>
              {subjects.map((s) => {
                const pct = s.stats.percentage;
                return (
                  <NavLink
                    key={s.row.id}
                    to={`/subject/${encodeURIComponent(s.row.id)}`}
                    onClick={onClose}
                    className={linkClass}
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{
                        background: `conic-gradient(${pct === 100 ? "var(--c-success)" : "var(--c-primary)"} ${pct * 3.6}deg, var(--c-surface-3) 0)`,
                        boxShadow: "0 0 0 2px var(--c-surface-3)",
                      }}
                    />
                    <span className="min-w-0 flex-1 truncate">{s.row.name}</span>
                    <span className="font-numbers text-[11px] text-fg-subtle">{pct}%</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </nav>

        <div className="flex items-center gap-1 border-t border-border p-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex h-9 flex-1 cursor-pointer items-center gap-2.5 rounded-xl px-3 text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
