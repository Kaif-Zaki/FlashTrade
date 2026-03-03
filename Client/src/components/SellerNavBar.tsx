import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Mail, User } from "lucide-react";
import vexoLogo from "../assets/VexoLogo.png";
import { getPendingSellerReviewsRequest, getSellerOrdersRequest } from "../service/sellerService";

const SellerNavBar = () => {
  const location = useLocation();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const loadNotificationCount = async () => {
      try {
        const [reviews, orders] = await Promise.all([
          getPendingSellerReviewsRequest(),
          getSellerOrdersRequest(),
        ]);
        const activeOrders = orders.filter((order) => order.orderStatus !== "delivered").length;
        setNotificationCount(reviews.length + activeOrders);
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

  return (
    <header className="w-full bg-[#f5f5f3]">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-10 lg:py-4">
        <Link to="/" className="flex items-center">
          <img src={vexoLogo} alt="Vexo" className="h-8 w-auto sm:h-9" />
        </Link>

        <div className="flex items-center gap-5">
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

      <nav className="no-scrollbar overflow-x-auto px-4 pb-3 pt-2 sm:px-6 lg:px-10 lg:py-4">
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
          <Link to="/seller/notifications">
            <NavItem text="Notifications" active={location.pathname === "/seller/notifications"} />
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

export default SellerNavBar;
