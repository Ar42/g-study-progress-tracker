import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useStudyStore } from "./stores/useStudyStore";
import { AppShell } from "./layouts/AppShell";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { SubjectPage } from "./pages/subject/SubjectPage";

function App() {
  const loadSubjects = useStudyStore((state) => state.loadSubjects);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

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

