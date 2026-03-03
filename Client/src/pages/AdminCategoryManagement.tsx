import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import {
  createCategoryRequest,
  deleteCategoryRequest,
  getCategoriesRequest,
  updateCategoryRequest,
} from "../service/categoryService";
import type { Category } from "../types/Category";

const AdminCategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
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

  const startEditCategory = (category: Category) => {
    setEditingCategoryId(category._id);
    setEditName(category.name);
    setEditDescription(category.description || "");
    setEditImageUrl(category.imageUrl || "");
    setError("");
    setMessage("");
  };

  const cancelEditCategory = () => {
    setEditingCategoryId("");
    setEditName("");
    setEditDescription("");
    setEditImageUrl("");
  };

  const handleUpdateCategory = async (categoryId: string) => {
    setError("");
    setMessage("");

    if (!editName.trim()) {
      setError("Category name is required");
      return;
    }

    setIsUpdating(true);
    try {
      const updatedCategory = await updateCategoryRequest(categoryId, {
        name: editName.trim(),
        description: editDescription.trim(),
        imageUrl: editImageUrl.trim(),
      });

      setCategories((prev) =>
        prev.map((category) => (category._id === categoryId ? updatedCategory : category))
      );
      setMessage("Category updated successfully");
      cancelEditCategory();
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to update category");
      } else {
        setError("Failed to update category");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-indigo-50 to-emerald-50 p-6 shadow-sm">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Category Management</h1>
          <p className="mt-1 text-sm text-slate-600">
            Add, update, and organize product categories with image support.
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <form onSubmit={handleCreate} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Add New Category</h2>
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
              {imageUrl.trim() && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <img
                    src={imageUrl}
                    alt="Category preview"
                    className="h-28 w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
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
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Existing Categories</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {categories.length} total
              </span>
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            {message && <p className="mt-3 text-sm text-green-700">{message}</p>}
            <div className="mt-4 space-y-3">
              {categories.map((category) => (
                <div
                  key={category._id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  {editingCategoryId === category._id ? (
                    <div className="w-full space-y-2">
                      {editImageUrl.trim() && (
                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                          <img
                            src={editImageUrl}
                            alt="Category preview"
                            className="h-28 w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Category name"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description"
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
                      />
                      <input
                        value={editImageUrl}
                        onChange={(e) => setEditImageUrl(e.target.value)}
                        placeholder="Image URL"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateCategory(category._id)}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
                        >
                          <Save size={14} />
                          {isUpdating ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditCategory}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70"
                        >
                          <X size={14} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
                          {category.imageUrl ? (
                            <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-400">
                              No Img
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{category.name}</p>
                          <p className="text-xs text-slate-600">{category.description || "No description"}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEditCategory(category)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
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
                    </div>
                  )}
                </div>
              ))}
              {categories.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                  No categories yet. Add your first category from the form.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminCategoryManagement;
