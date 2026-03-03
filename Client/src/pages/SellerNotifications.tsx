import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Link } from "react-router-dom";
import { ClipboardList, MessageSquareCheck } from "lucide-react";
import { getPendingSellerReviewsRequest, getSellerOrdersRequest } from "../service/sellerService";

const SellerNotifications = () => {
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotificationCounts = async () => {
    setError("");
    setLoading(true);
    try {
      const [reviews, orders] = await Promise.all([
        getPendingSellerReviewsRequest(),
        getSellerOrdersRequest(),
      ]);
      setPendingReviewCount(reviews.length);
      setActiveOrderCount(orders.filter((order) => order.orderStatus !== "delivered").length);
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
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-bold text-slate-900">Seller Notifications</h1>
        <p className="mt-1 text-sm text-slate-600">Check order updates and customer reviews waiting for approval.</p>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Link to="/seller/orders" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 hover:ring-slate-300">
            <div className="flex items-center gap-3">
              <ClipboardList size={20} className="text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900">Order Manage</h2>
            </div>
            <p className="mt-2 text-sm text-slate-600">Track delivery progress and update order status.</p>
            <p className="mt-4 text-3xl font-bold text-amber-600">{loading ? "..." : activeOrderCount}</p>
            <p className="text-xs uppercase tracking-widest text-slate-500">Active order updates</p>
          </Link>

          <Link to="/seller/reviews" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 hover:ring-slate-300">
            <div className="flex items-center gap-3">
              <MessageSquareCheck size={20} className="text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900">Review Manage</h2>
            </div>
            <p className="mt-2 text-sm text-slate-600">Approve customer reviews for your products.</p>
            <p className="mt-4 text-3xl font-bold text-emerald-600">{loading ? "..." : pendingReviewCount}</p>
            <p className="text-xs uppercase tracking-widest text-slate-500">Pending review approvals</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SellerNotifications;
