import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { ArrowLeft, Package, Trash2, UserCircle2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  getSellerDetailRequest,
  getSellerProductsForAdminRequest,
  removeSellerProductAsAdminRequest,
} from "../service/adminService";
import type { AuthUser } from "../service/authService";
import type { Product } from "../types/Product";

const AdminSellerProducts = () => {
  const { sellerId = "" } = useParams();
  const [seller, setSeller] = useState<AuthUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingProductId, setRemovingProductId] = useState("");

  const loadSellerData = async () => {
    if (!sellerId) return;
    setIsLoading(true);
    setError("");
    try {
      const [sellerData, sellerProducts] = await Promise.all([
        getSellerDetailRequest(sellerId),
        getSellerProductsForAdminRequest(sellerId),
      ]);
      setSeller(sellerData.seller);
      setProducts(sellerProducts);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to load seller products");
      } else {
        setError("Failed to load seller products");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSellerData();
  }, [sellerId]);

  const handleRemoveProduct = async (productId: string) => {
    setRemovingProductId(productId);
    setError("");
    try {
      await removeSellerProductAsAdminRequest(productId);
      setProducts((prev) => prev.filter((product) => product._id !== productId));
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to remove product");
      } else {
        setError("Failed to remove product");
      }
    } finally {
      setRemovingProductId("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-5 flex items-center justify-start gap-3">
          <Link
            to="/admin/manage"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <ArrowLeft size={14} />
            Back to Admin Panel
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div className="rounded-xl bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
              <UserCircle2 size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {seller?.name || "Seller"} Products
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">{seller?.email || "-"}</p>
            </div>
          </div>
          <div className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Total Products: {products.length}
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {isLoading && <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Loading seller products...</p>}

        {!isLoading && products.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No products found for this seller</p>
          </div>
        )}

        {!isLoading && products.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <article
                key={product._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="relative aspect-square bg-slate-100 dark:bg-slate-800">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-500">
                      <Package size={18} />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{product.name}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    LKR {Number(product.price || 0).toLocaleString()} | Stock: {product.stock}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(product._id)}
                    disabled={removingProductId === product._id}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-70"
                  >
                    <Trash2 size={13} />
                    {removingProductId === product._id ? "Removing..." : "Remove Product"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSellerProducts;
