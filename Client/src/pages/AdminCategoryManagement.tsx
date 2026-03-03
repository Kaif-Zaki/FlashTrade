import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Plus, Trash2 } from "lucide-react";
import {
  createCategoryRequest,
  deleteCategoryRequest,
  getCategoriesRequest,
} from "../service/categoryService";
import type { Category } from "../types/Category";

const AdminCategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadCategories = async () => {
    setError("");
    try {
      const list = await getCategoriesRequest();
      setCategories(list);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to load categories");
      } else {
        setError("Failed to load categories");
      }
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Category name is required");
      return;
    }

    setIsSaving(true);
    try {
      const category = await createCategoryRequest({
        name: name.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
      });
      setCategories((prev) => [category, ...prev]);
      setName("");
      setDescription("");
      setImageUrl("");
      setMessage("Category created successfully");
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to create category");
      } else {
        setError("Failed to create category");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    setDeletingCategoryId(categoryId);
    setError("");
    setMessage("");
    try {
      await deleteCategoryRequest(categoryId);
      setCategories((prev) => prev.filter((category) => category._id !== categoryId));
      setMessage("Category deleted successfully");
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to delete category");
      } else {
        setError("Failed to delete category");
      }
    } finally {
      setDeletingCategoryId("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {/* <h1 className="text-2xl font-bold text-slate-900">Category Management</h1> */}
        <p className="mt-1 text-sm text-slate-600">Add and manage product categories for the platform.</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <form onSubmit={handleCreate} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Add Category</h2>
            <div className="mt-4 space-y-3">
              <input
                placeholder="Category name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
              />
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
              />
              <input
                placeholder="Image URL (optional)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
              />
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
            >
              <Plus size={16} />
              {isSaving ? "Saving..." : "Add Category"}
            </button>
          </form>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">Existing Categories</h2>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            {message && <p className="mt-3 text-sm text-green-700">{message}</p>}
            <div className="mt-4 space-y-3">
              {categories.map((category) => (
                <div
                  key={category._id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{category.name}</p>
                    <p className="text-xs text-slate-600">{category.description || "No description"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(category._id)}
                    disabled={deletingCategoryId === category._id}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-70"
                  >
                    <Trash2 size={14} />
                    {deletingCategoryId === category._id ? "Removing..." : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminCategoryManagement;
