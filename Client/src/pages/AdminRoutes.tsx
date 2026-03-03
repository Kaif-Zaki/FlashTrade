import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth.ts";
import type { UserRole } from "../types/Auth.ts";

interface ProtectedRoutesProps {
  allowedRoles?: UserRole[];
  requireApprovedSeller?: boolean;
}

const AdminRoutes = ({ allowedRoles = [], requireApprovedSeller = false }: ProtectedRoutesProps) => {
  const { isLoggedIn, userRole, sellerApproved, sellerActive } = useAuth();

  if (!isLoggedIn) return <Navigate to="/login" />;
  if (allowedRoles.length > 0 && (!userRole || !allowedRoles.includes(userRole))) {
    return <Navigate to="/dashboard" />;
  }
  if (
    requireApprovedSeller &&
    userRole === "seller" &&
    (sellerApproved !== true || sellerActive === false)
  ) {
    return <Navigate to="/seller/approval-required" />;
  }

  return <Outlet />;
};

export default AdminRoutes;
