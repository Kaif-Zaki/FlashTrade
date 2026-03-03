import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AxiosError } from "axios";
import { BarChart3, Boxes, ShoppingBag, Users } from "lucide-react";
import {
  getAdminOrdersRequest,
  getAllUsersRequest,
  getApprovedSellersRequest,
  getPendingSellersRequest,
  type AdminOrder,
} from "../service/adminService";
import { getProductsRequest } from "../service/productService";
import type { Product } from "../types/Product";

const AdminAnalytics = () => {
  const [users, setUsers] = useState<{ role: string }[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pendingSellers, setPendingSellers] = useState(0);
  const [approvedSellers, setApprovedSellers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setError("");
      setIsLoading(true);
      try {
        const [allUsers, allOrders, allProducts, pending, approved] = await Promise.all([
          getAllUsersRequest(),
          getAdminOrdersRequest(),
          getProductsRequest(),
          getPendingSellersRequest(),
          getApprovedSellersRequest(),
        ]);

        setUsers(allUsers);
        setOrders(allOrders);
        setProducts(allProducts);
        setPendingSellers(pending.length);
        setApprovedSellers(approved.length);
      } catch (err) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || "Failed to load analytics");
        } else {
          setError("Failed to load analytics");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const analytics = useMemo(() => {
    const totalUsers = users.length;
    const totalCustomers = users.filter((user) => user.role === "customer").length;
    const totalAdmins = users.filter((user) => user.role === "admin").length;
    const totalSellers = users.filter((user) => user.role === "seller").length;

    const totalOrders = orders.length;
    const grossRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const totalCommission = orders.reduce((sum, order) => {
      const orderCommission = (order.items || []).reduce(
        (itemSum, item) => itemSum + (item.commissionAmount || 0),
        0
      );
      return sum + orderCommission;
    }, 0);
    const totalSellerNet = orders.reduce((sum, order) => {
      const orderNet = (order.items || []).reduce(
        (itemSum, item) => itemSum + (item.sellerNetAmount || 0),
        0
      );
      return sum + orderNet;
    }, 0);

    const transactionAudit = orders.reduce(
      (acc, order) => {
        const orderGross = (order.items || []).reduce(
          (sum, item) => sum + (item.price || 0) * (item.qty || 0),
          0
        );
        const orderCommission = (order.items || []).reduce(
          (sum, item) => sum + (item.commissionAmount || 0),
          0
        );
        const orderSellerNet = (order.items || []).reduce(
          (sum, item) => sum + (item.sellerNetAmount || 0),
          0
        );

        if (Math.abs(order.totalPrice - orderGross) > 0.01) {
          acc.orderTotalMismatchCount += 1;
        }

        if (Math.abs(orderGross - (orderCommission + orderSellerNet)) > 0.01) {
          acc.commissionPayoutMismatchCount += 1;
        }

        for (const item of order.items || []) {
          const grossItem = (item.price || 0) * (item.qty || 0);
          const commissionRate = item.commissionRate || 0;
          const expectedCommission = (grossItem * commissionRate) / 100;
          const storedCommission = item.commissionAmount || 0;
          const storedSellerNet = item.sellerNetAmount || 0;

          if (item.commissionAmount === undefined || item.sellerNetAmount === undefined) {
            acc.missingCommissionSnapshotItems += 1;
          }

          if (Math.abs(expectedCommission - storedCommission) > 0.01) {
            acc.itemCommissionMismatchCount += 1;
          }

          if (Math.abs(grossItem - (storedCommission + storedSellerNet)) > 0.01) {
            acc.itemPayoutMismatchCount += 1;
          }
        }

        return acc;
      },
      {
        orderTotalMismatchCount: 0,
        commissionPayoutMismatchCount: 0,
        itemCommissionMismatchCount: 0,
        itemPayoutMismatchCount: 0,
        missingCommissionSnapshotItems: 0,
      }
    );

    const paidOrders = orders.filter((order) => order.paymentStatus === "paid").length;
    const failedPayments = orders.filter((order) => order.paymentStatus === "failed").length;
    const codPending = orders.filter(
      (order) => order.paymentMethod === "cash" && order.paymentStatus === "pending"
    ).length;

    const orderStatus = {
      processing: orders.filter((order) => order.orderStatus === "processing").length,
      shipped: orders.filter((order) => order.orderStatus === "shipped").length,
      delivered: orders.filter((order) => order.orderStatus === "delivered").length,
    };

    const categoryCounts = products.reduce<Record<string, number>>((acc, product) => {
      const categoryName =
        typeof product.category === "object" && product.category?.name
          ? product.category.name
          : "Uncategorized";
      acc[categoryName] = (acc[categoryName] || 0) + 1;
      return acc;
    }, {});

    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const recentOrders = [...orders]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 6);

    return {
      totalUsers,
      totalCustomers,
      totalAdmins,
      totalSellers,
      totalOrders,
      grossRevenue,
      totalCommission,
      totalSellerNet,
      paidOrders,
      failedPayments,
      codPending,
      orderStatus,
      topCategories,
      recentOrders,
      transactionAudit,
    };
  }, [orders, products, users]);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} />
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          </div>
          <p className="mt-1 text-sm text-slate-200">Live marketplace metrics for admin decisions.</p>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {isLoading && <p className="mt-4 text-sm text-slate-600">Loading analytics...</p>}

        {!isLoading && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Total Users" value={analytics.totalUsers} icon={<Users size={17} />} />
              <MetricCard title="Total Products" value={products.length} icon={<Boxes size={17} />} />
              <MetricCard title="Total Orders" value={analytics.totalOrders} icon={<ShoppingBag size={17} />} />
              <MetricCard
                title="Gross Revenue"
                value={`LKR ${analytics.grossRevenue.toLocaleString()}`}
                icon={<BarChart3 size={17} />}
              />
            </div>

            <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Platform Commission</p>
              <p className="mt-2 text-2xl font-bold text-amber-600">
                LKR {analytics.totalCommission.toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-slate-600">
                Seller Net Payout: LKR {analytics.totalSellerNet.toLocaleString()}
              </p>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Users Breakdown</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <Row label="Customers" value={analytics.totalCustomers} />
                  <Row label="Sellers" value={analytics.totalSellers} />
                  <Row label="Admins" value={analytics.totalAdmins} />
                </div>
              </section>

              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Seller Status</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <Row label="Approved Sellers" value={approvedSellers} />
                  <Row label="Pending Sellers" value={pendingSellers} />
                </div>
              </section>

              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Payment Status</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <Row label="Paid Orders" value={analytics.paidOrders} />
                  <Row label="COD Pending" value={analytics.codPending} />
                  <Row label="Failed Payments" value={analytics.failedPayments} />
                </div>
              </section>
            </div>

            <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Transaction Integrity Check
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Use these checks to verify admin-side commission and transaction correctness.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Row label="Order Total Mismatches" value={analytics.transactionAudit.orderTotalMismatchCount} />
                <Row
                  label="Commission/Payout Mismatch Orders"
                  value={analytics.transactionAudit.commissionPayoutMismatchCount}
                />
                <Row
                  label="Item Commission Mismatches"
                  value={analytics.transactionAudit.itemCommissionMismatchCount}
                />
                <Row
                  label="Item Payout Mismatches"
                  value={analytics.transactionAudit.itemPayoutMismatchCount}
                />
                <Row
                  label="Items Missing Commission Snapshot"
                  value={analytics.transactionAudit.missingCommissionSnapshotItems}
                />
              </div>
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Order Pipeline</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <Row label="Processing" value={analytics.orderStatus.processing} />
                  <Row label="Shipped" value={analytics.orderStatus.shipped} />
                  <Row label="Delivered" value={analytics.orderStatus.delivered} />
                </div>
              </section>

              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Top Categories</h2>
                <div className="mt-4 space-y-2">
                  {analytics.topCategories.length === 0 && (
                    <p className="text-sm text-slate-600">No category data yet.</p>
                  )}
                  {analytics.topCategories.map(([name, count]) => (
                    <Row key={name} label={name} value={count} />
                  ))}
                </div>
              </section>
            </div>

            <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Recent Orders</h2>
              <div className="mt-4 space-y-3">
                {analytics.recentOrders.length === 0 && (
                  <p className="text-sm text-slate-600">No orders yet.</p>
                )}
                {analytics.recentOrders.map((order) => {
                  const customerName =
                    typeof order.user === "object" ? order.user.name || order.user.email || "Customer" : order.user;
                  return (
                    <div
                      key={order._id}
                      className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Order #{order._id.slice(-8)}</p>
                        <p className="text-xs text-slate-600">Customer: {customerName}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-bold text-emerald-700">LKR {order.totalPrice.toLocaleString()}</p>
                        <p className="text-xs text-slate-600">
                          {order.orderStatus} | {order.paymentStatus}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon }: { title: string; value: string | number; icon: ReactNode }) => (
  <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <div className="text-slate-600">{icon}</div>
    </div>
    <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
  </div>
);

const Row = ({ label, value }: { label: string; value: number | string }) => (
  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
    <span className="text-slate-600">{label}</span>
    <span className="font-semibold text-slate-900">{value}</span>
  </div>
);

export default AdminAnalytics;
