import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  getSellerOrdersRequest,
  updateSellerOrderPaymentStatusRequest,
  updateSellerOrderStatusRequest,
  type SellerOrder,
  type SellerPaymentStatus,
  type SellerOrderStatus,
} from "../service/sellerService";
import LoadingAnimation from "../components/Loading";

const SellerOrderManagement = () => {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [savingOrderId, setSavingOrderId] = useState("");
  const [error, setError] = useState("");

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const orderData = await getSellerOrdersRequest();
      setOrders(orderData);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to load seller orders");
      } else {
        setError("Failed to load seller orders");
      }
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  if (loadingOrders) {
    return (
      <LoadingAnimation
        title="Loading Seller Orders"
        subtitle="Fetching customer orders and payment statuses..."
      />
    );
  }

  const handleStatusChange = async (orderId: string, status: SellerOrderStatus) => {
    setSavingOrderId(orderId);
    setError("");
    try {
      await updateSellerOrderStatusRequest(orderId, status);
      await loadOrders();
      window.dispatchEvent(new Event("seller-notification-updated"));
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to update order status");
      } else {
        setError("Failed to update order status");
      }
    } finally {
      setSavingOrderId("");
    }
  };

  const handlePaymentStatusChange = async (orderId: string, status: SellerPaymentStatus) => {
    setSavingOrderId(orderId);
    setError("");
    try {
      await updateSellerOrderPaymentStatusRequest(orderId, status);
      await loadOrders();
      window.dispatchEvent(new Event("seller-notification-updated"));
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to update payment status");
      } else {
        setError("Failed to update payment status");
      }
    } finally {
      setSavingOrderId("");
    }
  };

  const getOrderStatusStyles = (status: SellerOrderStatus) => {
    if (status === "delivered") return "bg-emerald-100 text-emerald-700";
    if (status === "shipped") return "bg-blue-100 text-blue-700";
    return "bg-amber-100 text-amber-700";
  };

  const getPaymentStatusStyles = (status: string) => {
    if (status === "paid") return "bg-emerald-100 text-emerald-700";
    if (status === "failed") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-sm">
          <h1 className="text-2xl font-bold">Order Management</h1>
          <p className="mt-1 text-sm text-slate-200">
            Track deliveries, verify COD payments, and keep order flow updated.
          </p>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          {orders.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              No customer orders assigned to your products yet.
            </p>
          )}
          <div className="space-y-4">
            {orders.map((order) => (
              <article key={order._id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold tracking-wide text-slate-900 dark:text-slate-100">Order #{order._id.slice(-8)}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      Customer: {order.user?.name || "Unknown"} ({order.user?.email || "No email"})
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">Address: {order.shippingAddress}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getOrderStatusStyles(order.orderStatus)}`}>
                      {order.orderStatus.toUpperCase()}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getPaymentStatusStyles(order.paymentStatus)}`}>
                      PAYMENT: {order.paymentStatus.toUpperCase()}
                    </span>
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      {order.paymentMethod.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Order Items</p>
                    <p className="text-sm font-bold text-emerald-700">LKR {order.sellerTotal.toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                  {order.sellerItems.map((item, idx) => (
                    <div
                      key={`${order._id}-${idx}`}
                      className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-200 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                    >
                      <p className="leading-5">
                        {item.product?.name || "Product"} x {item.qty}
                        {" | "}Size: <span className="font-semibold">{item.size || "-"}</span> | Color:{" "}
                        <span className="font-semibold">{item.color || "-"}</span>
                      </p>
                      <span>LKR {(item.price * item.qty).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Delivery Status
                    </p>
                    <div className="flex items-center gap-2">
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleStatusChange(order._id, e.target.value as SellerOrderStatus)}
                        disabled={savingOrderId === order._id}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                  </div>

                  {order.paymentMethod === "cash" ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        COD Payment Status
                      </p>
                      <select
                        value={(order.paymentStatus === "paid" ? "paid" : "pending") as SellerPaymentStatus}
                        onChange={(e) =>
                          handlePaymentStatusChange(order._id, e.target.value as SellerPaymentStatus)
                        }
                        disabled={savingOrderId === order._id}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Online Payment
                      </p>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Status: {order.paymentStatus.toUpperCase()}
                      </p>
                    </div>
                  )}
                </div>

                {savingOrderId === order._id && (
                  <p className="mt-3 text-xs font-semibold text-slate-500">Updating order...</p>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SellerOrderManagement;
