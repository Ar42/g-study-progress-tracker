import { useEffect } from "react";
import { Toaster } from "sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useStudyStore } from "./stores/useStudyStore";
import { AppShell } from "./layouts/AppShell";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { SubjectPage } from "./pages/subject/SubjectPage";
import { ReportsPage } from "./pages/reports/ReportsPage";
import { useFetchStudyDataQuery } from "./services/sheetApi";


function App() {
  const { data, isLoading, error } = useFetchStudyDataQuery();
  const setSubjects = useStudyStore((state) => state.setSubjects);

  useEffect(() => {
    if (data) {
      setSubjects(data);
    }
  }, [data, setSubjects]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center space-y-4">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-border-subtle" />
          <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
        </div>
        <div className="space-y-1 text-center">
          <h2 className="text-base font-bold text-text-primary">Loading Study Progress</h2>
          <p className="text-xs text-text-muted">Synchronizing with Google Sheets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorDetails = 
      error && typeof error === "object" && "message" in error 
        ? String((error as any).message) 
        : "Verify sheet link sharing permissions (Anyone with the link can view).";

    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6 space-y-6">
        <div className="h-16 w-16 rounded-full bg-status-progress-bg border border-status-progress/20 flex items-center justify-center text-status-progress">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="space-y-2.5 text-center max-w-sm">
          <h2 className="text-lg font-bold text-text-primary">Connection Failed</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Failed to sync study tracker data from Google Sheets.
          </p>
          <div className="text-[11px] font-mono text-status-progress bg-status-progress-bg/50 border border-status-progress/20 px-3 py-2 rounded-lg break-all">
            {errorDetails}
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-xs font-semibold bg-primary text-text-primary hover:bg-primary-hover rounded-lg transition-colors cursor-pointer shadow-md"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster theme="dark" richColors position="top-right" />
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="subject/:subjectId" element={<SubjectPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
