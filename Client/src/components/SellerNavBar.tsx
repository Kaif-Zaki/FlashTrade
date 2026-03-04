import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Mail, Menu, User, X } from "lucide-react";
import vexoLogo from "../assets/VexoLogo.png";
import {
  getPendingSellerReviewsRequest,
  getSellerAnalyticsRequest,
  getSellerOrdersRequest,
} from "../service/sellerService";

const SellerNavBar = () => {
  const location = useLocation();
  const [notificationCount, setNotificationCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadNotificationCount = async () => {
      try {
        const [reviews, orders, analytics] = await Promise.all([
          getPendingSellerReviewsRequest(),
          getSellerOrdersRequest(),
          getSellerAnalyticsRequest(),
        ]);
        const activeOrders = orders.filter((order) => order.orderStatus !== "delivered").length;
        const lowStockAlerts = analytics.lowStockAlerts.length;
        setNotificationCount(reviews.length + activeOrders + lowStockAlerts);
      } catch {
        setNotificationCount(0);
      }
    };

    loadNotificationCount();
    const onSellerNotificationUpdated = () => {
      loadNotificationCount();
    };
    window.addEventListener("seller-notification-updated", onSellerNotificationUpdated);
    return () => {
      window.removeEventListener("seller-notification-updated", onSellerNotificationUpdated);
    };
  }, [location.pathname]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  return (
    <header className="w-full bg-[#f5f5f3] dark:bg-slate-900">
      <div className="px-4 py-3 sm:px-6 lg:hidden">
        <div className="flex flex-col gap-3">
          <Link to="/" className="flex shrink-0 items-center">
            <img src={vexoLogo} alt="Vexo" className="h-8 w-auto" />
          </Link>

          <div className="flex w-full items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <Link
                to="/seller/notifications"
                aria-label="Seller notifications"
                className="relative inline-flex items-center text-slate-800 dark:text-slate-100"
              >
                <Mail className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
                    {notificationCount}
                  </span>
                )}
              </Link>
              <Link to="/private-details" aria-label="Private Details" className="inline-flex items-center text-slate-800 dark:text-slate-100">
                <User className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu overlay"
          />
          <aside className="absolute right-0 top-0 h-full w-[82%] max-w-xs overflow-y-auto bg-white p-5 shadow-xl dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <img src={vexoLogo} alt="Vexo" className="h-8 w-auto" />
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg border border-slate-300 p-2 text-slate-800 dark:border-slate-700 dark:text-slate-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-1">
              <MobileNavLink to="/" label="Home" onNavigate={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink to="/products" label="All Product" onNavigate={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink to="/seller/manage" label="Seller Panel" onNavigate={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink to="/seller/analytics" label="Analytics" onNavigate={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink to="/seller/notifications" label="Notifications" onNavigate={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink to="/private-details" label="Private Details" onNavigate={() => setIsMobileMenuOpen(false)} />
            </nav>
          </aside>
        </div>
      )}

      <div className="px-4 py-3 sm:px-6 lg:px-10">
        <div className="hidden items-center gap-4 lg:flex">
          <Link to="/" className="flex shrink-0 items-center">
            <img src={vexoLogo} alt="Vexo" className="h-8 w-auto sm:h-9" />
          </Link>

          <nav className="no-scrollbar flex-1 overflow-x-auto">
            <div className="flex w-max min-w-full items-center justify-start gap-6 text-xs font-medium uppercase tracking-wide sm:justify-center sm:gap-8 sm:text-sm lg:gap-10">
              <Link to="/">
                <NavItem text="Home" active={location.pathname === "/"} />
              </Link>
              <Link to="/products">
                <NavItem text="All Product" active={location.pathname === "/products"} />
              </Link>
              <Link to="/seller/manage">
                <NavItem text="Seller Panel" active={location.pathname === "/seller/manage"} />
              </Link>
              <Link to="/seller/analytics">
                <NavItem text="Analytics" active={location.pathname === "/seller/analytics"} />
              </Link>
              <Link to="/seller/notifications">
                <NavItem text="Notifications" active={location.pathname === "/seller/notifications"} />
              </Link>
            </div>
          </nav>

          <div className="flex shrink-0 items-center gap-5">
            <Link
              to="/seller/notifications"
              aria-label="Seller notifications"
              title="Seller notifications"
              className="flex items-center font-medium hover:text-blue-600"
            >
              <span className="relative inline-flex">
                <Mail className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {notificationCount}
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
      </div>
    </header>
  );
};

function NavItem({ text, active = false }: { text: string; active?: boolean }) {
  return (
    <div
      className={`flex shrink-0 items-center gap-2 cursor-pointer transition-colors hover:text-blue-600 ${
        active ? "text-blue-700 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"
      }`}
    >
      {text}
    </div>
  );
}

export default SellerNavBar;

function MobileNavLink({
  to,
  label,
  onNavigate,
}: {
  to: string;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
    >
      {label}
    </Link>
  );
}
