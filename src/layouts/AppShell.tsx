import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Menu, RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import { useLazyFetchStudyDataQuery } from "../services/sheetApi";
import { useStudyStore } from "../stores/useStudyStore";
import { toast } from "sonner";

export const AppShell: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [triggerFetch, { isFetching }] = useLazyFetchStudyDataQuery();
  const setSubjects = useStudyStore((state) => state.setSubjects);

  const handleSync = async () => {
    try {
      const data = await triggerFetch().unwrap();
      if (data) {
        setSubjects(data);
        toast.success("Data synced successfully from Google Sheets!");
      }
    } catch {
      toast.error("Failed to sync data from Google Sheets.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-base text-text-primary">
      {/* Mobile Top Navbar */}
      <header className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-bg-surface backdrop-blur-md sticky top-0 z-20">
        <Link
          to="/"
          className="flex items-center gap-3"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="font-bold text-text-primary text-lg">G</span>
          </div>
          <span className="font-bold text-base tracking-wide bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">
            G Study Tracker
          </span>
        </Link>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-1.5 rounded-lg border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 lg:pl-64 min-w-0 transition-all duration-300">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Sync Button */}
      <button
        onClick={handleSync}
        disabled={isFetching}
        title="Sync Now"
        className={clsx(
          "fixed bottom-6 right-6 z-50 flex items-center justify-center p-4 rounded-full shadow-lg transition-all duration-300",
          isFetching
            ? "bg-bg-surface border border-border-subtle text-text-muted cursor-not-allowed scale-95"
            : "bg-primary text-text-primary hover:bg-primary-hover hover:scale-105 hover:shadow-primary/30 shadow-primary/20",
        )}
      >
        <RefreshCw className={clsx("h-6 w-6", isFetching && "animate-spin")} />
      </button>
    </div>
  );
};
AppShell.displayName = "AppShell";
