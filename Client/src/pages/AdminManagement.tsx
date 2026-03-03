import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { ShieldCheck, UserPlus, UserRoundCheck, RefreshCcw } from "lucide-react";
import {
  approveSellerRequest,
  createAdminRequest,
  getApprovedSellersRequest,
  getPendingSellersRequest,
  removeSellerRequest,
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

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Pending Sellers</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{pendingSellers.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Approval Queue</p>
            <p className="mt-3 text-3xl font-bold text-amber-600">
              {isLoadingSellers ? "..." : pendingSellers.length > 0 ? "Active" : "Clear"}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Admin Actions</p>
            <p className="mt-3 text-3xl font-bold text-emerald-600">Enabled</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <form
            onSubmit={handleCreateAdmin}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4 lg:col-span-2"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900">Create Admin</h2>
            </div>
            <p className="text-sm text-slate-500">Grant platform-level access to a trusted team member.</p>

            <div>
              <label className="mb-1 block text-sm text-slate-600">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-600">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-600">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-600">Address (optional)</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
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

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-3">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UserRoundCheck size={18} className="text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-900">Seller Approvals</h2>
              </div>
              <button
                type="button"
                onClick={loadPendingSellers}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
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
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-70"
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
                {approvedSellers.map((seller) => (
                  <div
                    key={seller._id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{seller.name}</p>
                      <p className="text-xs text-slate-600">{seller.email}</p>
                      <p className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Approved Seller
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSeller(seller._id)}
                      disabled={removingSellerId === seller._id}
                      className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-70"
                    >
                      {removingSellerId === seller._id ? "Removing..." : "Remove Seller"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;
