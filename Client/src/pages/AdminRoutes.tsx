import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth.ts";
import type { UserRole } from "../types/Auth.ts";

interface ProtectedRoutesProps {
  allowedRoles?: UserRole[];
}

const AdminRoutes = ({ allowedRoles = [] }: ProtectedRoutesProps) => {
  const { isLoggedIn, userRole } = useAuth();

  if (!isLoggedIn) return <Navigate to="/login" />;
  if (allowedRoles.length > 0 && (!userRole || !allowedRoles.includes(userRole))) {
    return <Navigate to="/dashboard" />;
  }

  return <Outlet />;
};

export default AdminRoutes;
