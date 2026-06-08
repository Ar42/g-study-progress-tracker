import React from "react";
import { Link, useLocation } from "react-router-dom";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  FileSpreadsheet,
  X,
} from "lucide-react";

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
    <div className="flex h-full flex-col bg-bg-surface border-r border-border-subtle p-5">
      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="flex items-center gap-3" onClick={onClose}>
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="font-bold text-text-primary text-xl">G</span>
          </div>
          <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">
            StudyTracker
          </span>
        </Link>
        <button
          className="lg:hidden p-1.5 rounded-lg border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <div
                key={item.name}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-muted cursor-not-allowed rounded-lg opacity-60 group relative"
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-border-subtle text-text-muted px-1.5 py-0.5 rounded font-normal">
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
                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                isActive
                  ? "bg-primary text-text-primary shadow-lg shadow-primary/15"
                  : "text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-subtle pt-4 text-xs text-text-muted text-center">
        v1.0.0 &bull; Dynamic Calculations
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
