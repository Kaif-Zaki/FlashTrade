import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { getUserOrdersRequest } from "../service/orderService";
import type { Order, OrderItem } from "../types/Order";
import type { Product } from "../types/Product";
import LoadingAnimation from "../components/Loading";

const getItemName = (item: OrderItem) => {
  if (typeof item.product === "string") return item.product;
  return (item.product as Product).name;
};

const OrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      setOrders([]);
      setError("");
      setIsLoading(true);
      try {
        const result = await getUserOrdersRequest();
        setOrders(result);
      } catch (err) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || "Failed to load orders");
        } else {
          setError("Failed to load orders");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
    const onAuthUpdated = () => {
      loadOrders();
    };
    window.addEventListener("auth-updated", onAuthUpdated);
    return () => {
      window.removeEventListener("auth-updated", onAuthUpdated);
    };
  }, []);

  if (isLoading) {
    return (
      <LoadingAnimation
        title="Loading Orders"
        subtitle="Retrieving your order history and status updates..."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Order History</h1>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {!error && orders.length === 0 && (
          <p className="text-sm text-gray-600">No orders yet.</p>
        )}

        {!error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <p className="text-sm font-semibold text-gray-900">Order #{order._id.slice(-8)}</p>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                </div>

                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={`${order._id}-${idx}`} className="flex items-center justify-between gap-3 text-sm">
                      <div className="text-gray-700">
                        <p>
                          {getItemName(item)} x {item.qty}
                        </p>
                        <p className="text-xs text-gray-500">
                          Size: {item.size || "-"} | Color: {item.color || "-"}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900">LKR {(item.price * item.qty).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 border-t border-gray-100 pt-3 text-sm sm:grid-cols-2">
                  <p>
                    <span className="font-semibold">Payment:</span> {order.paymentMethod} ({order.paymentStatus})
                  </p>
                  <p>
                    <span className="font-semibold">Order Status:</span> {order.orderStatus}
                  </p>
                  <p className="sm:col-span-2">
                    <span className="font-semibold">Shipping Address:</span> {order.shippingAddress}
                  </p>
                </div>

                <div className="mt-4 flex justify-end border-t border-gray-100 pt-3">
                  <p className="text-base font-bold text-gray-900">Total: LKR {order.totalPrice.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
