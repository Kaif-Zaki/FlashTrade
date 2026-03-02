import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar.tsx";
import { useAuth } from "../context/useAuth.ts";
import LoadingAnimation from "../components/Loading.tsx";
import Footer from "../components/Footer.tsx";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const Layout = () => {
  const { isAuthenticating } = useAuth();
  const location = useLocation();

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
      <div className="sticky top-0 z-50">
        <NavBar />
      </div>
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
