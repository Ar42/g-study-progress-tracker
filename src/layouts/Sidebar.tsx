import React from "react";
import { Link, useLocation } from "react-router-dom";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  FileSpreadsheet,
  X,
  BookOpen,
  Code,
  BarChart3,
} from "lucide-react";

interface SidebarProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const isBcsActive =
    location.pathname === "/" || location.pathname.startsWith("/subject");
  const isItActive = location.pathname === "/it";
  const isBcsReportsActive =
    location.pathname === "/reports/bcs" || location.pathname === "/reports";
  const isItReportsActive = location.pathname === "/reports/it";

  const sidebarContent = (
    <div className="flex h-full flex-col bg-bg-surface border-r border-border-subtle p-5 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="flex items-center gap-3" onClick={onClose}>
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="font-bold text-text-primary text-xl">G</span>
          </div>
          <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">
            G Study Tracker
          </span>
        </Link>
        <button
          className="lg:hidden p-1.5 rounded-lg border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-colors cursor-pointer"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-6">
        {/* Main Dashboard Link */}
        <div className="space-y-1">
          <Link
            to="/"
            onClick={onClose}
            className={clsx(
              "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
              location.pathname === "/"
                ? "bg-primary text-text-primary shadow-lg shadow-primary/15"
                : "text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary",
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Study Modules Group */}
        <div className="space-y-1.5">
          <p className="px-4 text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Study Modules
          </p>
          <div className="space-y-1 pl-1">
            <Link
              to="/"
              onClick={onClose}
              className={clsx(
                "flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                isBcsActive && location.pathname !== "/"
                  ? "bg-primary/15 text-primary border border-primary/25 font-semibold"
                  : isBcsActive && location.pathname === "/"
                    ? "text-primary font-semibold"
                    : "text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary",
              )}
            >
              <BookOpen className="h-4.5 w-4.5" />
              <span>BCS</span>
            </Link>

            <Link
              to="/it"
              onClick={onClose}
              className={clsx(
                "flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                isItActive
                  ? "bg-primary text-text-primary shadow-lg shadow-primary/15"
                  : "text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary",
              )}
            >
              <Code className="h-4.5 w-4.5" />
              <span>IT</span>
            </Link>
          </div>
        </div>

        {/* Reports Submenu Group */}
        <div className="space-y-1.5">
          <p className="px-4 text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Reports
          </p>
          <div className="space-y-1 pl-1">
            <Link
              to="/reports/bcs"
              onClick={onClose}
              className={clsx(
                "flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                isBcsReportsActive
                  ? "bg-primary text-text-primary shadow-lg shadow-primary/15"
                  : "text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary",
              )}
            >
              <FileSpreadsheet className="h-4.5 w-4.5" />
              <span>BCS Reports</span>
            </Link>

            <Link
              to="/reports/it"
              onClick={onClose}
              className={clsx(
                "flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                isItReportsActive
                  ? "bg-primary text-text-primary shadow-lg shadow-primary/15"
                  : "text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary",
              )}
            >
              <BarChart3 className="h-4.5 w-4.5" />
              <span>IT Reports</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="border-t border-border-subtle pt-4 text-xs text-text-muted text-center">
        v2.0.0 &bull; Multi-Domain Tracker
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
