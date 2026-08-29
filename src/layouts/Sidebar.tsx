import React from "react";
import { Link, useLocation } from "react-router-dom";
import { clsx } from "clsx";
import { LayoutDashboard, FileSpreadsheet, X } from "lucide-react";

interface SidebarProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

interface NavItem {
  readonly name: string;
  readonly path: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly disabled?: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Reports", path: "/reports", icon: FileSpreadsheet },
  // { name: "Analytics", path: "/analytics", icon: BarChart3, disabled: true },
  // { name: "Exam Planner", path: "/exam-planner", icon: Calendar, disabled: true },
  // { name: "Mock Tests", path: "/mock-tests", icon: GraduationCap, disabled: true },
  // { name: "Vocabulary", path: "/vocabulary", icon: BookOpen, disabled: true },
  // { name: "Reports", path: "/reports", icon: FileSpreadsheet, disabled: true },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const sidebarContent = (
    <div className="flex h-full flex-col bg-bg-surface/85 backdrop-blur-2xl border-r border-border-subtle p-5">
      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="flex items-center gap-3 group" onClick={onClose}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform duration-200">
            <span className="font-extrabold text-text-primary text-xl tracking-tight">G</span>
          </div>
          <div>
            <span className="font-extrabold text-base tracking-wide bg-gradient-to-r from-text-primary via-slate-100 to-text-secondary bg-clip-text text-transparent block">
              Study Tracker
            </span>
            <span className="text-[11px] text-text-muted font-medium">BPSC & BCS Prep</span>
          </div>
        </Link>
        <button
          className="lg:hidden p-2 rounded-xl border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <div
                key={item.name}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-muted cursor-not-allowed rounded-xl opacity-50 group relative"
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{item.name}</span>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-border-subtle text-text-muted px-2 py-0.5 rounded-full font-normal">
                  Soon
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 relative group",
                isActive
                  ? "bg-primary text-text-primary shadow-lg shadow-primary/25 border border-primary/40"
                  : "text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary hover:translate-x-0.5",
              )}
            >
              <Icon className={clsx("h-4.5 w-4.5 transition-transform group-hover:scale-110", isActive ? "text-text-primary" : "text-text-muted group-hover:text-primary")} />
              <span>{item.name}</span>
              {isActive && (
                <span className="absolute right-3.5 h-2 w-2 rounded-full bg-white shadow-sm shadow-white" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-subtle pt-4 text-[11px] text-text-muted text-center flex items-center justify-center gap-2">
        <span className="h-2 w-2 rounded-full bg-status-completed inline-block animate-pulse" />
        Live Sheet Sync
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={clsx(
          "fixed top-0 bottom-0 left-0 z-50 w-64 lg:z-30 transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
Sidebar.displayName = "Sidebar";
