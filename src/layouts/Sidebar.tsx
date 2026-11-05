import { NavLink } from "react-router-dom";
import { BarChart3, BookOpen, Code2, LayoutDashboard, LogOut, PieChart, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { IconButton } from "../components/ui";
import type { Subject } from "../types";

interface NavItem {
  readonly to: string;
  readonly label: string;
  readonly icon: ReactNode;
  readonly end?: boolean;
}

const SECTIONS: readonly { title?: string; items: readonly NavItem[] }[] = [
  { items: [{ to: "/", label: "Dashboard", icon: <LayoutDashboard />, end: true }] },
  { title: "Study", items: [{ to: "/it", label: "IT topics", icon: <Code2 /> }] },
  {
    title: "Reports",
    items: [
      { to: "/reports/bcs", label: "BCS report", icon: <BarChart3 /> },
      { to: "/reports/it", label: "IT report", icon: <PieChart /> },
    ],
  },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors [&_svg]:size-4 [&_svg]:shrink-0",
    isActive ? "bg-surface-3 font-medium text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
  );

export interface SidebarProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onLogout: () => void;
  readonly subjects: readonly Subject[];
}

export function Sidebar({ open, onClose, onLogout, subjects }: SidebarProps) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/60 animate-fade-in lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <NavLink to="/" onClick={onClose} className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-fg">
              G
            </span>
            <span className="text-sm font-semibold text-fg">Study Tracker</span>
          </NavLink>
          <IconButton label="Close menu" icon={<X />} onClick={onClose} className="lg:hidden" />
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
          {SECTIONS.map((section, i) => (
            <div key={section.title ?? i} className="space-y-0.5">
              {section.title && (
                <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
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
            <div className="space-y-0.5">
              <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
                BCS subjects
              </p>
              {subjects.map((s) => (
                <NavLink
                  key={s.row.id}
                  to={`/subject/${encodeURIComponent(s.row.id)}`}
                  onClick={onClose}
                  className={linkClass}
                >
                  <BookOpen />
                  <span className="min-w-0 flex-1 truncate">{s.row.name}</span>
                  <span className="font-numbers text-[11px] text-fg-subtle">{s.stats.percentage}%</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
