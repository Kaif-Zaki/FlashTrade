import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth.ts";

const AdminRoutes = () => {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) return <Navigate to="/login" />;

  return <Outlet />;
};

export default AdminRoutes;
