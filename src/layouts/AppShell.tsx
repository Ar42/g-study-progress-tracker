import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";

export const AppShell: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-bg-base text-text-primary">
      {/* Mobile Top Navbar */}
      <header className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-bg-surface backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="font-bold text-text-primary text-lg">G</span>
          </div>
          <span className="font-bold text-base tracking-wide bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">
            StudyTracker
          </span>
        </div>
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
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Content Area */}
        <main className="flex-1 lg:pl-64 min-w-0 transition-all duration-300">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
AppShell.displayName = "AppShell";
