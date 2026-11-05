import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AppShell } from "./layouts/AppShell";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { SubjectPage } from "./pages/SubjectPage";
import { ITPage } from "./pages/ITPage";
import { BcsReportPage, ItReportPage } from "./pages/ReportsPage";
import { LoginPage } from "./pages/LoginPage";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster theme="dark" position="bottom-right" richColors closeButton />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="subject/:subjectId" element={<SubjectPage />} />
            <Route path="it" element={<ITPage />} />
            <Route path="reports" element={<Navigate to="/reports/bcs" replace />} />
            <Route path="reports/bcs" element={<BcsReportPage />} />
            <Route path="reports/it" element={<ItReportPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
