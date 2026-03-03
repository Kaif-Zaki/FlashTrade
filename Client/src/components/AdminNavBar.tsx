import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Mail, User } from "lucide-react";
import vexoLogo from "../assets/VexoLogo.png";
import { getPendingSellersRequest } from "../service/adminService";

const AdminNavBar = () => {
  const location = useLocation();
  const [pendingSellerCount, setPendingSellerCount] = useState(0);

  useEffect(() => {
    const loadPendingSellerCount = async () => {
      try {
        const pendingSellers = await getPendingSellersRequest();
        setPendingSellerCount(pendingSellers.length);
      } catch {
        setPendingSellerCount(0);
      }
    };

    loadPendingSellerCount();
    const onSellerApprovalUpdated = () => {
      loadPendingSellerCount();
    };
    window.addEventListener("seller-approval-updated", onSellerApprovalUpdated);
    return () => {
      window.removeEventListener("seller-approval-updated", onSellerApprovalUpdated);
    };
  }, [location.pathname]);

  return (
    <header className="w-full bg-[#f5f5f3]">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-10 lg:py-4">
        <Link to="/" className="flex items-center">
          <img src={vexoLogo} alt="Vexo" className="h-8 w-auto sm:h-9" />
        </Link>

        <div className="flex items-center gap-5">
          <Link
            to="/admin/manage"
            aria-label="Seller approval notifications"
            title="Seller approval notifications"
            className="flex items-center font-medium hover:text-blue-600"
          >
            <span className="relative inline-flex">
              <Mail className="h-5 w-5" />
              {pendingSellerCount > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {pendingSellerCount}
                </span>
              )}
            </span>
          </Link>
          <Link
            to="/private-details"
            aria-label="Private Details"
            title="Private Details"
            className="flex items-center font-medium hover:text-blue-600"
          >
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <nav className="no-scrollbar overflow-x-auto px-4 pb-3 pt-2 sm:px-6 lg:px-10 lg:py-4">
        <div className="flex w-max min-w-full items-center justify-start gap-6 text-xs font-medium uppercase tracking-wide sm:justify-center sm:gap-8 sm:text-sm lg:gap-10">
          <Link to="/">
            <NavItem text="Home" active={location.pathname === "/"} />
          </Link>
          <Link to="/products">
            <NavItem text="All Product" active={location.pathname === "/products"} />
          </Link>
          <Link to="/admin/manage">
            <NavItem text="Admin Panel" active={location.pathname === "/admin/manage"} />
          </Link>
          <Link to="/admin/analytics">
            <NavItem text="Analytics" active={location.pathname === "/admin/analytics"} />
          </Link>
          <Link to="/admin/categories">
            <NavItem text="Category Manage" active={location.pathname === "/admin/categories"} />
          </Link>
          <Link to="/admin/commissions">
            <NavItem text="Commissions" active={location.pathname === "/admin/commissions"} />
          </Link>
        </div>
      </nav>
    </header>
  );
};

function NavItem({ text, active = false }: { text: string; active?: boolean }) {
  return (
    <div className={`flex shrink-0 items-center gap-2 cursor-pointer hover:text-blue-600 ${active ? "text-red-500" : "text-black"}`}>
      {text}
    </div>
  );
}

export default AdminNavBar;
