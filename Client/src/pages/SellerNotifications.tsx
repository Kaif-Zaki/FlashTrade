import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Link } from "react-router-dom";
import { AlertTriangle, ClipboardList, MessageSquareCheck } from "lucide-react";
import {
  getPendingSellerReviewsRequest,
  getSellerAnalyticsRequest,
  getSellerOrdersRequest,
} from "../service/sellerService";

const SellerNotifications = () => {
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotificationCounts = async () => {
    setError("");
    setLoading(true);
    try {
      const [reviews, orders, analytics] = await Promise.all([
        getPendingSellerReviewsRequest(),
        getSellerOrdersRequest(),
        getSellerAnalyticsRequest(),
      ]);
      setPendingReviewCount(reviews.length);
      setActiveOrderCount(orders.filter((order) => order.orderStatus !== "delivered").length);
      setLowStockCount(analytics.lowStockAlerts.length);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to load notifications");
      } else {
        setError("Failed to load notifications");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotificationCounts();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Link
            to="/seller/orders"
            className="group rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50 to-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:from-slate-900 dark:to-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">Orders</p>
                <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-slate-100">Delivery Updates</h2>
              </div>
              <div className="rounded-xl bg-blue-600 p-2 text-white">
                <ClipboardList size={18} />
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-slate-300">Track delivery progress and update order status.</p>
            <p className="mt-5 text-3xl font-black text-gray-900 dark:text-slate-100">{loading ? "..." : activeOrderCount}</p>
            <p className="text-xs uppercase tracking-[0.15em] text-gray-500 dark:text-slate-400">Active order updates</p>
            <p className="mt-4 text-xs font-semibold text-gray-700 transition-colors group-hover:text-black dark:text-slate-300 dark:group-hover:text-slate-100">
              Open Order Management
            </p>
          </Link>

          <Link
            to="/seller/reviews"
            className="group rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:from-slate-900 dark:to-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">Reviews</p>
                <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-slate-100">Approval Queue</h2>
              </div>
              <div className="rounded-xl bg-emerald-600 p-2 text-white">
                <MessageSquareCheck size={18} />
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-slate-300">Approve customer reviews for your products.</p>
            <p className="mt-5 text-3xl font-black text-gray-900 dark:text-slate-100">{loading ? "..." : pendingReviewCount}</p>
            <p className="text-xs uppercase tracking-[0.15em] text-gray-500 dark:text-slate-400">Pending review approvals</p>
            <p className="mt-4 text-xs font-semibold text-gray-700 transition-colors group-hover:text-black dark:text-slate-300 dark:group-hover:text-slate-100">
              Open Review Management
            </p>
          </Link>

          <Link
            to="/seller/analytics"
            className="group rounded-2xl border border-rose-200 bg-gradient-to-b from-rose-50 to-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:from-slate-900 dark:to-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">Inventory</p>
                <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-slate-100">Low Stock Alerts</h2>
              </div>
              <div className="rounded-xl bg-rose-600 p-2 text-white">
                <AlertTriangle size={18} />
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-slate-300">Products with stock less than or equal to 5 units.</p>
            <p className="mt-5 text-3xl font-black text-gray-900 dark:text-slate-100">{loading ? "..." : lowStockCount}</p>
            <p className="text-xs uppercase tracking-[0.15em] text-gray-500 dark:text-slate-400">Needs restock</p>
            <p className="mt-4 text-xs font-semibold text-gray-700 transition-colors group-hover:text-black dark:text-slate-300 dark:group-hover:text-slate-100">
              Open Seller Analytics
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SellerNotifications;
