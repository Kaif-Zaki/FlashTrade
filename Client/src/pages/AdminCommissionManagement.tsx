import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  createCommissionRuleRequest,
  deleteCommissionRuleRequest,
  getCommissionRulesRequest,
  updateCommissionRuleRequest,
  type CommissionRule,
} from "../service/adminService";
import { getCategoriesRequest } from "../service/categoryService";
import type { Category } from "../types/Category";

const AdminCommissionManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [form, setForm] = useState({
    category: "",
    minQty: "",
    maxQty: "",
    ratePercent: "",
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    setError("");
    try {
      const [categoryData, ruleData] = await Promise.all([
        getCategoriesRequest(),
        getCommissionRulesRequest(),
      ]);
      setCategories(categoryData);
      setRules(ruleData);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to load commission rules");
      } else {
        setError("Failed to load commission rules");
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const minQty = Number(form.minQty);
    const maxQty = form.maxQty ? Number(form.maxQty) : null;
    const ratePercent = Number(form.ratePercent);

    if (!form.category) {
      setError("Category is required");
      return;
    }
    if (!Number.isFinite(minQty) || minQty < 1) {
      setError("Minimum quantity must be at least 1");
      return;
    }
    if (!Number.isFinite(ratePercent) || ratePercent < 0 || ratePercent > 100) {
      setError("Commission percent must be between 0 and 100");
      return;
    }
    if (maxQty !== null && (!Number.isFinite(maxQty) || maxQty < minQty)) {
      setError("Max quantity must be empty or greater than min quantity");
      return;
    }

    setIsSaving(true);
    try {
      const createdRule = await createCommissionRuleRequest({
        category: form.category,
        minQty,
        maxQty,
        ratePercent,
        isActive: form.isActive,
      });
      setRules((prev) => [createdRule, ...prev]);
      setMessage("Commission rule created");
      setForm({
        category: "",
        minQty: "",
        maxQty: "",
        ratePercent: "",
        isActive: true,
      });
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to create rule");
      } else {
        setError("Failed to create rule");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRuleStatus = async (rule: CommissionRule) => {
    try {
      const updated = await updateCommissionRuleRequest(rule._id, {
        isActive: !rule.isActive,
      });
      setRules((prev) => prev.map((item) => (item._id === rule._id ? updated : item)));
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to update rule");
      } else {
        setError("Failed to update rule");
      }
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    setDeletingRuleId(ruleId);
    try {
      await deleteCommissionRuleRequest(ruleId);
      setRules((prev) => prev.filter((rule) => rule._id !== ruleId));
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to delete rule");
      } else {
        setError("Failed to delete rule");
      }
    } finally {
      setDeletingRuleId("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-bold text-slate-900">Commission Management</h1>
        <p className="mt-1 text-sm text-slate-600">
          Set commission pricing by category and quantity tiers for seller listings.
        </p>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-4 text-sm text-green-700">{message}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <form onSubmit={handleCreateRule} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Add Commission Rule</h2>
            <div className="mt-4 space-y-3">
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                placeholder="Min quantity"
                type="number"
                min={1}
                value={form.minQty}
                onChange={(e) => setForm((prev) => ({ ...prev, minQty: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
              />
              <input
                placeholder="Max quantity (optional)"
                type="number"
                min={1}
                value={form.maxQty}
                onChange={(e) => setForm((prev) => ({ ...prev, maxQty: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
              />
              <input
                placeholder="Commission percent"
                type="number"
                min={0}
                max={100}
                value={form.ratePercent}
                onChange={(e) => setForm((prev) => ({ ...prev, ratePercent: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
              />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Active rule
              </label>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Create Rule"}
            </button>
          </form>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">Current Rules</h2>
            <div className="mt-4 space-y-3">
              {rules.length === 0 && <p className="text-sm text-slate-600">No rules found.</p>}
              {rules.map((rule) => (
                <div
                  key={rule._id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{rule.category?.name || "Category"}</p>
                    <p className="text-xs text-slate-600">
                      Qty {rule.minQty} - {rule.maxQty ?? "and above"} | {rule.ratePercent}% commission
                    </p>
                    <p
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        rule.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {rule.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleRuleStatus(rule)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      {rule.isActive ? "Disable" : "Enable"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule._id)}
                      disabled={deletingRuleId === rule._id}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-70"
                    >
                      {deletingRuleId === rule._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminCommissionManagement;
