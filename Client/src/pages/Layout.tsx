import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar.tsx";
import { useAuth } from "../context/useAuth.ts";
import LoadingAnimation from "../components/Loading.tsx";
import Footer from "../components/Footer.tsx";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import AdminNavBar from "../components/AdminNavBar.tsx";
import SellerNavBar from "../components/SellerNavBar.tsx";

const Layout = () => {
  const { isAuthenticating, isLoggedIn, userRole, sellerApproved, sellerActive } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";
  const showAdminNav = isLoggedIn && userRole === "admin";
  const showSellerNav =
    isLoggedIn && userRole === "seller" && sellerApproved === true && sellerActive !== false;
  const showCustomerNav = !showAdminNav && !showSellerNav;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  if (isAuthenticating)
    return (
      <>
        <LoadingAnimation />{" "}
      </>
    );

  return (
    <div className="min-h-screen">
      {!isAuthPage && (
        <div className="sticky top-0 z-50">
          {showAdminNav && <AdminNavBar />}
          {showSellerNav && <SellerNavBar />}
          {showCustomerNav && <NavBar />}
        </div>
      )}
      <main>
        <Outlet />
      </main>
      {!isAuthPage && showCustomerNav && <Footer />}
    </div>
  );
};

export default Layout;
