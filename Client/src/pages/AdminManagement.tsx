import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { ShieldCheck, UserPlus, UserRoundCheck, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";
import {
  approveSellerRequest,
  createAdminRequest,
  getApprovedSellersRequest,
  getPendingSellersRequest,
  removeSellerRequest,
  updateSellerActiveStatusRequest,
} from "../service/adminService";
import type { AuthUser } from "../service/authService";

const AdminManagement = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const [pendingSellers, setPendingSellers] = useState<AuthUser[]>([]);
  const [approvedSellers, setApprovedSellers] = useState<AuthUser[]>([]);
  const [isLoadingSellers, setIsLoadingSellers] = useState(true);
  const [sellerError, setSellerError] = useState("");
  const [approvingSellerId, setApprovingSellerId] = useState("");
  const [removingSellerId, setRemovingSellerId] = useState("");
  const [updatingSellerStatusId, setUpdatingSellerStatusId] = useState("");

  const loadPendingSellers = async () => {
    setSellerError("");
    setIsLoadingSellers(true);
    try {
      const [pending, approved] = await Promise.all([
        getPendingSellersRequest(),
        getApprovedSellersRequest(),
      ]);
      setPendingSellers(pending);
      setApprovedSellers(approved);
    } catch (err) {
      if (err instanceof AxiosError) {
        setSellerError(err.response?.data?.message || "Failed to load pending sellers");
      } else {
        setSellerError("Failed to load pending sellers");
      }
    } finally {
      setIsLoadingSellers(false);
    }
  };

  useEffect(() => {
    loadPendingSellers();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormMessage("");
    setFormError("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError("Name, email, and password are required");
      return;
    }

    setIsCreatingAdmin(true);
    try {
      const result = await createAdminRequest({
        name: name.trim(),
        email: email.trim(),
        password,
        address: address.trim() || undefined,
      });

      setFormMessage(result.message || "Admin created successfully");
      setName("");
      setEmail("");
      setPassword("");
      setAddress("");
    } catch (err) {
      if (err instanceof AxiosError) {
        setFormError(err.response?.data?.message || "Failed to create admin");
      } else {
        setFormError("Failed to create admin");
      }
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleApproveSeller = async (sellerId: string) => {
    setApprovingSellerId(sellerId);
    setSellerError("");
    try {
      const result = await approveSellerRequest(sellerId);
      setPendingSellers((prev) => prev.filter((seller) => seller._id !== sellerId));
      setApprovedSellers((prev) => [result.user, ...prev]);
      window.dispatchEvent(new Event("seller-approval-updated"));
    } catch (err) {
      if (err instanceof AxiosError) {
        setSellerError(err.response?.data?.message || "Failed to approve seller");
      } else {
        setSellerError("Failed to approve seller");
      }
    } finally {
      setApprovingSellerId("");
    }
  };

  const handleRemoveSeller = async (sellerId: string) => {
    setRemovingSellerId(sellerId);
    setSellerError("");
    try {
      await removeSellerRequest(sellerId);
      setApprovedSellers((prev) => prev.filter((seller) => seller._id !== sellerId));
      window.dispatchEvent(new Event("seller-approval-updated"));
    } catch (err) {
      if (err instanceof AxiosError) {
        setSellerError(err.response?.data?.message || "Failed to remove seller");
      } else {
        setSellerError("Failed to remove seller");
      }
    } finally {
      setRemovingSellerId("");
    }
  };

  const handleToggleSellerStatus = async (seller: AuthUser) => {
    const isSellerActive = seller.sellerActive !== false;
    setUpdatingSellerStatusId(seller._id);
    setSellerError("");
    try {
      const result = await updateSellerActiveStatusRequest(seller._id, !isSellerActive);
      setApprovedSellers((prev) =>
        prev.map((item) => (item._id === seller._id ? result.user : item))
      );
    } catch (err) {
      if (err instanceof AxiosError) {
        setSellerError(err.response?.data?.message || "Failed to update seller status");
      } else {
        setSellerError("Failed to update seller status");
      }
    } finally {
      setUpdatingSellerStatusId("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-5 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-900">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">Pending Sellers</p>
            <p className="mt-2 text-3xl font-black text-gray-900 dark:text-slate-100">{pendingSellers.length}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Waiting for admin review</p>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-gradient-to-b from-sky-50 to-white p-5 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-900">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">Approval Queue</p>
            <p className="mt-2 text-3xl font-black text-gray-900 dark:text-slate-100">
              {isLoadingSellers ? "..." : pendingSellers.length > 0 ? "Active" : "Clear"}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Live onboarding status</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-5 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-900">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">Admin Actions</p>
            <p className="mt-2 text-3xl font-black text-gray-900 dark:text-slate-100">Enabled</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Management controls active</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <form
            onSubmit={handleCreateAdmin}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4 dark:bg-slate-900 dark:ring-slate-700 lg:col-span-2"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-slate-700 dark:text-slate-300" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create Admin</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Grant platform-level access to a trusted team member.</p>

            <div>
              <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300">Address (optional)</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}
            {formMessage && <p className="text-sm text-green-700">{formMessage}</p>}

            <button
              type="submit"
              disabled={isCreatingAdmin}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
            >
              <UserPlus size={16} />
              {isCreatingAdmin ? "Creating..." : "Create Admin"}
            </button>
          </form>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 lg:col-span-3">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UserRoundCheck size={18} className="text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-900">Seller Approvals</h2>
              </div>
              <button
                type="button"
                onClick={loadPendingSellers}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <RefreshCcw size={14} />
                Refresh
              </button>
            </div>

            {sellerError && <p className="mb-3 text-sm text-red-600">{sellerError}</p>}
            {isLoadingSellers && <p className="text-sm text-slate-600">Loading pending sellers...</p>}

            {!isLoadingSellers && pendingSellers.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="text-sm font-semibold text-slate-700">No pending sellers</p>
                <p className="mt-1 text-xs text-slate-500">New seller requests will appear here.</p>
              </div>
            )}

            <div className="space-y-3">
              {pendingSellers.map((seller) => (
                <div
                  key={seller._id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{seller.name}</p>
                    <p className="text-xs text-slate-600">{seller.email}</p>
                    <p className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      Pending Approval
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApproveSeller(seller._id)}
                    disabled={approvingSellerId === seller._id}
                    className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-70 sm:w-auto"
                  >
                    {approvingSellerId === seller._id ? "Approving..." : "Approve Seller"}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <h3 className="text-md font-semibold text-slate-900">Approved Sellers</h3>
              <p className="mb-3 mt-1 text-xs text-slate-500">You can remove seller access here.</p>
              {approvedSellers.length === 0 && (
                <p className="text-sm text-slate-600">No approved sellers.</p>
              )}
              <div className="space-y-3">
                {approvedSellers.map((seller) => {
                  const isSellerActive = seller.sellerActive !== false;
                  return (
                  <div
                    key={seller._id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{seller.name}</p>
                      <p className="text-xs text-slate-600">{seller.email}</p>
                      <p
                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          isSellerActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {isSellerActive ? "Active Seller" : "Inactive Seller"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/admin/sellers/${seller._id}/products`}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 sm:w-auto"
                      >
                        View Products
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleToggleSellerStatus(seller)}
                        disabled={updatingSellerStatusId === seller._id}
                        className={`w-full rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-70 sm:w-auto ${
                          isSellerActive
                            ? "bg-amber-600 hover:bg-amber-700"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        {updatingSellerStatusId === seller._id
                          ? "Updating..."
                          : isSellerActive
                            ? "Set Inactive"
                            : "Set Active"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSeller(seller._id)}
                        disabled={removingSellerId === seller._id}
                        className="w-full rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-70 sm:w-auto"
                      >
                        {removingSellerId === seller._id ? "Removing..." : "Remove Seller"}
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;
