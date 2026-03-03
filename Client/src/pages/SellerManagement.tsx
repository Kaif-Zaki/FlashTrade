import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { Briefcase, Boxes, ClipboardList, MessageSquareCheck, Pencil, Plus, Trash2, X } from "lucide-react";
import { getCategoriesRequest } from "../service/categoryService";
import type { Category } from "../types/Category";
import type { Product } from "../types/Product";
import {
  approveSellerReviewRequest,
  createSellerProductRequest,
  deleteSellerProductRequest,
  estimateSellerCommissionRequest,
  getSellerOrdersRequest,
  getPendingSellerReviewsRequest,
  getSellerProductsRequest,
  updateSellerProductRequest,
  updateSellerOrderStatusRequest,
  type SellerOrder,
  type SellerOrderStatus,
  type SellerPendingReview,
} from "../service/sellerService";

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "38", "39", "40", "41", "42", "43"];

const SellerManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [pendingReviews, setPendingReviews] = useState<SellerPendingReview[]>([]);
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "reviews">("products");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [error, setError] = useState("");
  const [savingOrderId, setSavingOrderId] = useState("");
  const [deletingProductId, setDeletingProductId] = useState("");
  const [approvingReviewId, setApprovingReviewId] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    sizePrices: {} as Record<string, string>,
    stock: "",
    imageUrl: "",
    sizes: [] as string[],
    colors: [] as string[],
    category: "",
  });
  const [colorDraft, setColorDraft] = useState("");
  const [editingProductId, setEditingProductId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [commissionPreview, setCommissionPreview] = useState<{
    ratePercent: number;
    commissionAmount: number;
    sellerNetAmount: number;
  } | null>(null);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const activeOrders = orders.filter((o) => o.orderStatus !== "delivered").length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.sellerTotal || 0), 0);
    return { totalProducts, activeOrders, totalRevenue };
  }, [products, orders]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const [categoryData, productData] = await Promise.all([
        getCategoriesRequest(),
        getSellerProductsRequest(),
      ]);
      setCategories(categoryData);
      setProducts(productData);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to load seller products");
      } else {
        setError("Failed to load seller products");
      }
    } finally {
      setLoadingProducts(false);
    }
  };

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

  const loadPendingReviews = async () => {
    setLoadingReviews(true);
    try {
      const reviewData = await getPendingSellerReviewsRequest();
      setPendingReviews(reviewData);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to load pending reviews");
      } else {
        setError("Failed to load pending reviews");
      }
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadOrders();
    loadPendingReviews();
  }, []);

  useEffect(() => {
    const calculateCommissionPreview = async () => {
      const qty = Number(form.stock);
      const unitPrice = Number(form.price);
      if (!form.category || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
        setCommissionPreview(null);
        return;
      }
      try {
        const estimate = await estimateSellerCommissionRequest({
          categoryId: form.category,
          qty,
          unitPrice,
        });
        setCommissionPreview({
          ratePercent: estimate.ratePercent,
          commissionAmount: estimate.commissionAmount,
          sellerNetAmount: estimate.sellerNetAmount,
        });
      } catch {
        setCommissionPreview(null);
      }
    };

    calculateCommissionPreview();
  }, [form.category, form.price, form.stock]);

  const resetProductForm = () => {
    setForm({
      name: "",
      description: "",
      price: "",
      sizePrices: {},
      stock: "",
      imageUrl: "",
      sizes: [],
      colors: [],
      category: "",
    });
    setColorDraft("");
    setEditingProductId("");
  };

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setCreateMessage("");

    if (!form.name || !form.description || !form.price || !form.stock || !form.imageUrl || !form.category) {
      setError("Name, description, price, stock, category and image URL are required");
      return;
    }

    const priceNum = Number(form.price);
    const stockNum = Number(form.stock);
    if (Number.isNaN(priceNum) || Number.isNaN(stockNum) || priceNum < 0 || stockNum < 0) {
      setError("Price and stock must be valid positive numbers");
      return;
    }

    const sizePricesPayload = form.sizes.reduce<Record<string, number>>((acc, size) => {
      const raw = form.sizePrices[size];
      if (raw === undefined || raw === null || raw === "") return acc;
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed >= 0) {
        acc[size] = parsed;
      }
      return acc;
    }, {});

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: priceNum,
      stock: stockNum,
      category: form.category,
      images: [form.imageUrl.trim()],
      sizes: form.sizes,
      sizePrices: sizePricesPayload,
      colors: form.colors,
    };

    setIsCreating(true);
    try {
      if (editingProductId) {
        const updated = await updateSellerProductRequest(editingProductId, payload);
        setProducts((prev) => prev.map((item) => (item._id === editingProductId ? updated : item)));
        setCreateMessage("Product updated successfully");
      } else {
        const created = await createSellerProductRequest(payload);
        setProducts((prev) => [created, ...prev]);
        setCreateMessage("Product added successfully");
      }
      resetProductForm();
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.message || (editingProductId ? "Failed to update product" : "Failed to create product")
        );
      } else {
        setError(editingProductId ? "Failed to update product" : "Failed to create product");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setDeletingProductId(productId);
    setError("");
    try {
      await deleteSellerProductRequest(productId);
      setProducts((prev) => prev.filter((item) => item._id !== productId));
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to delete product");
      } else {
        setError("Failed to delete product");
      }
    } finally {
      setDeletingProductId("");
    }
  };

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

  const handleApproveReview = async (reviewId: string) => {
    setApprovingReviewId(reviewId);
    setError("");
    try {
      await approveSellerReviewRequest(reviewId);
      setPendingReviews((prev) => prev.filter((review) => review._id !== reviewId));
      window.dispatchEvent(new Event("seller-notification-updated"));
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to approve review");
      } else {
        setError("Failed to approve review");
      }
    } finally {
      setApprovingReviewId("");
    }
  };

  const toggleSize = (size: string) => {
    setForm((prev) => {
      const exists = prev.sizes.includes(size);
      const nextSizes = exists ? prev.sizes.filter((value) => value !== size) : [...prev.sizes, size];
      const nextSizePrices = { ...prev.sizePrices };
      if (exists) {
        delete nextSizePrices[size];
      } else {
        nextSizePrices[size] = prev.price || "";
      }
      return {
        ...prev,
        sizes: nextSizes,
        sizePrices: nextSizePrices,
      };
    });
  };

  const addColor = () => {
    const normalizedColor = colorDraft.trim();
    if (!normalizedColor) return;
    setForm((prev) => {
      if (prev.colors.includes(normalizedColor)) return prev;
      return { ...prev, colors: [...prev.colors, normalizedColor] };
    });
    setColorDraft("");
  };

  const removeColor = (color: string) => {
    setForm((prev) => ({ ...prev, colors: prev.colors.filter((value) => value !== color) }));
  };

  const handleEditProduct = (product: Product) => {
    setError("");
    setCreateMessage("");
    setEditingProductId(product._id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? 0),
      sizePrices: Object.entries(product.sizePrices || {}).reduce<Record<string, string>>((acc, [size, value]) => {
        acc[size] = String(value);
        return acc;
      }, {}),
      stock: String(product.stock ?? 0),
      imageUrl: product.images?.[0] || "",
      sizes: product.sizes || [],
      colors: product.colors || [],
      category:
        typeof product.category === "object" && product.category?._id ? product.category._id : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">My Products</p>
            <p className="mt-2 text-3xl font-black text-gray-900 dark:text-slate-100">{stats.totalProducts}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Total listed items</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">Active Deliveries</p>
            <p className="mt-2 text-3xl font-black text-gray-900 dark:text-slate-100">{stats.activeOrders}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Orders in progress</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">Revenue</p>
            <p className="mt-2 text-3xl font-black text-gray-900 dark:text-slate-100">LKR {stats.totalRevenue.toLocaleString()}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">From your fulfilled orders</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
              activeTab === "products" ? "bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900" : "bg-white text-slate-700 ring-1 ring-slate-300 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700"
            }`}
          >
            <Boxes size={16} />
            Products
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
              activeTab === "orders" ? "bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900" : "bg-white text-slate-700 ring-1 ring-slate-300 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700"
            }`}
          >
            <ClipboardList size={16} />
            Orders
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
              activeTab === "reviews" ? "bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900" : "bg-white text-slate-700 ring-1 ring-slate-300 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700"
            }`}
          >
            <MessageSquareCheck size={16} />
            Reviews
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {activeTab === "products" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <form
              onSubmit={handleCreateProduct}
              className="flex h-fit flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]"
            >
              <div className="mb-4 flex items-center gap-2">
                <Plus size={17} className="text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingProductId ? "Edit Product" : "Add Product"}
                </h2>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                <input
                  placeholder="Product name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
                />
                <textarea
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
                  rows={4}
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    placeholder="Price"
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
                  />
                  <input
                    placeholder="Stock"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
                  />
                </div>
                <input
                  placeholder="Image URL"
                  value={form.imageUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
                />
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Select Sizes</p>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          form.sizes.includes(size)
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                {form.sizes.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Price by Size (optional)
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {form.sizes.map((size) => (
                        <div
                          key={`size-price-${size}`}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5"
                        >
                          <span className="w-10 text-xs font-semibold text-slate-700">{size}</span>
                          <input
                            type="number"
                            min="0"
                            value={form.sizePrices[size] ?? ""}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                sizePrices: { ...prev.sizePrices, [size]: e.target.value },
                              }))
                            }
                            placeholder={form.price ? `Default ${form.price}` : "Price"}
                            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-slate-600"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Add Colors</p>
                  <div className="flex gap-2">
                    <input
                      placeholder="Type color name (e.g. red, #ff0000)"
                      value={colorDraft}
                      onChange={(e) => setColorDraft(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
                    />
                    <button
                      type="button"
                      onClick={addColor}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Add
                    </button>
                  </div>
                  {(colorDraft || form.colors.length > 0) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {colorDraft.trim() && (
                        <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 bg-white px-3 py-1 text-xs">
                          <span
                            className="h-3 w-3 rounded-full border border-slate-300"
                            style={{ backgroundColor: colorDraft.trim() }}
                          />
                          <span className="text-slate-600">{colorDraft.trim()}</span>
                        </div>
                      )}
                      {form.colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => removeColor(color)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs hover:bg-slate-50"
                        >
                          <span
                            className="h-3 w-3 rounded-full border border-slate-300"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-slate-700">{color}</span>
                          <span className="text-slate-500">x</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
                {commissionPreview && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                      Commission Preview (admin rule)
                    </p>
                    <p className="mt-1 text-xs text-slate-700">
                      Rate: <span className="font-semibold">{commissionPreview.ratePercent}%</span>
                    </p>
                    <p className="text-xs text-slate-700">
                      Commission:{" "}
                      <span className="font-semibold">LKR {commissionPreview.commissionAmount.toLocaleString()}</span>
                    </p>
                    <p className="text-xs text-slate-700">
                      Your Net:{" "}
                      <span className="font-semibold">LKR {commissionPreview.sellerNetAmount.toLocaleString()}</span>
                    </p>
                  </div>
                )}
              </div>
              {createMessage && <p className="mt-3 text-sm text-green-700">{createMessage}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
                >
                  <Briefcase size={16} />
                  {isCreating ? "Saving..." : editingProductId ? "Update Product" : "Add Product"}
                </button>
                {editingProductId && (
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <X size={14} />
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>

            <section className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 lg:col-span-2 lg:max-h-[calc(100vh-7rem)]">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">My Product Catalog</h2>
              {loadingProducts && <p className="text-sm text-slate-600">Loading products...</p>}
              {!loadingProducts && products.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                  No products yet. Add your first product from the form.
                </p>
              )}
              <div className="space-y-3 overflow-y-auto pr-1">
                {products.map((product) => (
                  <div
                    key={product._id}
                    className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-14 w-14 rounded-lg object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
                          No Img
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-600">
                          LKR {product.price.toLocaleString()} | Stock: {product.stock}
                        </p>
                        {product.sizePrices && Object.keys(product.sizePrices).length > 0 && (
                          <p className="text-[11px] text-slate-500">
                            Size pricing:{" "}
                            {Object.entries(product.sizePrices)
                              .map(([size, price]) => `${size}: LKR ${Number(price).toLocaleString()}`)
                              .join(" | ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                      <button
                        type="button"
                        onClick={() => handleEditProduct(product)}
                        className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 sm:w-auto"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={deletingProductId === product._id}
                        onClick={() => handleDeleteProduct(product._id)}
                        className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-70 sm:w-auto"
                      >
                        <Trash2 size={14} />
                        {deletingProductId === product._id ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "orders" && (
          <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Customer Orders</h2>
            {loadingOrders && <p className="text-sm text-slate-600">Loading orders...</p>}
            {!loadingOrders && orders.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                No customer orders assigned to your products yet.
              </p>
            )}
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order._id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Order #{order._id.slice(-8)}</p>
                      <p className="text-xs text-slate-600">
                        Customer: {order.user?.name || "Unknown"} ({order.user?.email || "No email"})
                      </p>
                      <p className="text-xs text-slate-600">Address: {order.shippingAddress}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-700">LKR {order.sellerTotal.toLocaleString()}</p>
                      <p className="text-xs text-slate-600">
                        Payment: {order.paymentMethod} ({order.paymentStatus})
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {order.sellerItems.map((item, idx) => (
                      <div key={`${order._id}-${idx}`} className="flex items-center justify-between text-xs text-slate-700">
                        <span>
                          {item.product?.name || "Product"} x {item.qty}
                          {" | "}Size: {item.size || "-"} | Color: {item.color || "-"}
                        </span>
                        <span>LKR {(item.price * item.qty).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <select
                      value={order.orderStatus}
                      onChange={(e) => handleStatusChange(order._id, e.target.value as SellerOrderStatus)}
                      disabled={savingOrderId === order._id}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold outline-none focus:border-slate-600"
                    >
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                    {savingOrderId === order._id && <span className="text-xs text-slate-500">Updating...</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "reviews" && (
          <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Pending Customer Reviews</h2>
            {loadingReviews && <p className="text-sm text-slate-600">Loading pending reviews...</p>}
            {!loadingReviews && pendingReviews.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                No reviews waiting for your approval.
              </p>
            )}
            <div className="space-y-4">
              {pendingReviews.map((review) => (
                <div key={review._id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{review.productName || "Product"}</p>
                      <p className="text-xs text-slate-600">
                        By {review.name} ({review.email}) | Rating: {review.rating}/5
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApproveReview(review._id)}
                      disabled={approvingReviewId === review._id}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-70"
                    >
                      {approvingReviewId === review._id ? "Approving..." : "Approve Review"}
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{review.review}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default SellerManagement;
