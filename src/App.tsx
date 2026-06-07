import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useStudyStore } from "./stores/useStudyStore";
import { AppShell } from "./layouts/AppShell";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { SubjectPage } from "./pages/subject/SubjectPage";
import { useFetchStudyDataQuery } from "./services/sheetApi";

function App() {
  const { data, isLoading } = useFetchStudyDataQuery();
  const setSubjects = useStudyStore((state) => state.setSubjects);

  useEffect(() => {
    if (data) {
      setSubjects(data.subjects, data.isFallback, data.errorMsg);
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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="subject/:subjectId" element={<SubjectPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
