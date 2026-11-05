import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated } from "./session";

export function ProtectedRoute() {
  const location = useLocation();
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
