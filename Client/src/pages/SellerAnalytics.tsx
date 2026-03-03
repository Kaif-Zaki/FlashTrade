import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AxiosError } from "axios";
import { BarChart3, Boxes, TrendingUp, Wallet } from "lucide-react";
import { getSellerAnalyticsRequest, type SellerAnalytics } from "../service/sellerService";

const SellerAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    setError("");
    setIsLoading(true);
    try {
      const response = await getSellerAnalyticsRequest();
      setAnalytics(response);
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

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-indigo-50 to-emerald-50 p-6 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-slate-900 dark:text-slate-100" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Seller Analytics</h1>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Track your sales, commission costs, best sellers, and stock alerts.
          </p>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {isLoading && <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Loading analytics...</p>}

        {!isLoading && analytics && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Total Products"
                value={analytics.totalProducts}
                icon={<Boxes size={17} />}
                tone="sky"
              />
              <MetricCard
                title="Daily Sales"
                value={`LKR ${analytics.dailySales.toLocaleString()}`}
                icon={<TrendingUp size={17} />}
                tone="indigo"
              />
              <MetricCard
                title="Monthly Sales"
                value={`LKR ${analytics.monthlySales.toLocaleString()}`}
                icon={<BarChart3 size={17} />}
                tone="emerald"
              />
              <MetricCard
                title="Monthly Net Earnings"
                value={`LKR ${analytics.monthlyNetEarnings.toLocaleString()}`}
                icon={<Wallet size={17} />}
                tone="amber"
              />
            </div>

            <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Monthly Commission Paid To Platform
              </p>
              <p className="mt-2 text-2xl font-bold text-amber-600">
                LKR {analytics.monthlyCommission.toLocaleString()}
              </p>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sales Mix</h2>
                <div className="mt-4 space-y-3">
                  <BarRow
                    label="Daily Sales"
                    value={analytics.dailySales}
                    max={Math.max(analytics.monthlySales, analytics.monthlyNetEarnings, analytics.dailySales, 1)}
                    color="bg-indigo-500"
                  />
                  <BarRow
                    label="Monthly Sales"
                    value={analytics.monthlySales}
                    max={Math.max(analytics.monthlySales, analytics.monthlyNetEarnings, analytics.dailySales, 1)}
                    color="bg-emerald-500"
                  />
                  <BarRow
                    label="Net Earnings"
                    value={analytics.monthlyNetEarnings}
                    max={Math.max(analytics.monthlySales, analytics.monthlyNetEarnings, analytics.dailySales, 1)}
                    color="bg-sky-500"
                  />
                  <BarRow
                    label="Commission"
                    value={analytics.monthlyCommission}
                    max={Math.max(analytics.monthlySales, analytics.monthlyNetEarnings, analytics.dailySales, 1)}
                    color="bg-amber-500"
                  />
                </div>
              </section>

              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Performance Candles</h2>
                <div className="mt-5 flex items-end justify-around gap-3">
                  <CandleBar
                    label="Daily"
                    value={analytics.dailySales}
                    max={Math.max(analytics.monthlySales, analytics.monthlyNetEarnings, analytics.dailySales, 1)}
                    color="bg-indigo-500"
                  />
                  <CandleBar
                    label="Monthly"
                    value={analytics.monthlySales}
                    max={Math.max(analytics.monthlySales, analytics.monthlyNetEarnings, analytics.dailySales, 1)}
                    color="bg-emerald-500"
                  />
                  <CandleBar
                    label="Net"
                    value={analytics.monthlyNetEarnings}
                    max={Math.max(analytics.monthlySales, analytics.monthlyNetEarnings, analytics.dailySales, 1)}
                    color="bg-sky-500"
                  />
                  <CandleBar
                    label="Fee"
                    value={analytics.monthlyCommission}
                    max={Math.max(analytics.monthlySales, analytics.monthlyNetEarnings, analytics.dailySales, 1)}
                    color="bg-amber-500"
                  />
                </div>
              </section>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Best-selling Products
                </h2>
                <div className="mt-4 space-y-2">
                  {analytics.bestSellingProducts.length === 0 && (
                    <p className="text-sm text-slate-600">No sales yet.</p>
                  )}
                  {analytics.bestSellingProducts.map((item) => (
                    <Row key={item.productId} label={item.name} value={item.soldQty} />
                  ))}
                </div>
              </section>

              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Low-stock Alerts
                </h2>
                <div className="mt-4 space-y-2">
                  {analytics.lowStockAlerts.length === 0 && (
                    <p className="text-sm text-slate-600">No low stock alerts.</p>
                  )}
                  {analytics.lowStockAlerts.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2"
                    >
                      <span className="text-sm text-slate-700">{item.name}</span>
                      <span className="font-semibold text-rose-700">{item.stock}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
  tone: "sky" | "indigo" | "emerald" | "amber";
}) => (
  <div
    className={`rounded-2xl p-4 shadow-sm ring-1 ${
      tone === "sky"
        ? "border border-sky-200 bg-sky-50/70 ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700"
        : tone === "indigo"
          ? "border border-indigo-200 bg-indigo-50/70 ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700"
          : tone === "emerald"
            ? "border border-emerald-200 bg-emerald-50/70 ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700"
            : "border border-amber-200 bg-amber-50/70 ring-amber-100 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700"
    }`}
  >
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
      <div className="text-slate-600 dark:text-slate-300">{icon}</div>
    </div>
    <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
  </div>
);

const BarRow = ({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) => {
  const width = Math.max(8, Math.round((value / Math.max(max, 1)) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
        <span>{label}</span>
        <span className="font-semibold text-slate-900 dark:text-slate-100">LKR {value.toLocaleString()}</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-700">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
};

const CandleBar = ({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) => {
  const height = Math.max(18, Math.round((value / Math.max(max, 1)) * 120));
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex h-32 items-end">
        <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-slate-300 dark:bg-slate-600" />
        <span className={`relative z-10 w-7 rounded-md ${color}`} style={{ height }} />
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: number | string }) => (
  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
    <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
    <span className="font-semibold text-slate-900 dark:text-slate-100">{value}</span>
  </div>
);

export default SellerAnalyticsPage;
