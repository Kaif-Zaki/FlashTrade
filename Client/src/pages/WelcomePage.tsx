import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProductsRequest } from "../service/productService";
import { getCategoriesRequest } from "../service/categoryService";
import type { Product } from "../types/Product";
import type { Category } from "../types/Category";
import allCategoryImage from "../assets/AllCategory.avif";
import LoadingAnimation from "../components/Loading";

interface DisplayCategory {
  _id: string;
  name: string;
  imageUrl?: string;
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<DisplayCategory[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [categoriesError, setCategoriesError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const result = await getProductsRequest();
        setProducts(result);
      } catch {
        setProductsError("Failed to load products");
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result: Category[] = await getCategoriesRequest();
        setCategories([
          { _id: "all", name: "All Category", imageUrl: allCategoryImage },
          ...result,
        ]);
      } catch {
        setCategoriesError("Failed to load categories");
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  const heroProduct = useMemo(() => products[0], [products]);
  const heroRightTopProduct = useMemo(() => {
    const heroId = heroProduct?._id;
    const preferred = products.find((product) => {
      if (product._id === heroId) return false;
      const name = product.name.toLowerCase();
      return (
        name.includes("airpod") ||
        name.includes("headphone") ||
        name.includes("earbud")
      );
    });
    if (preferred) return preferred;
    return products.find((product) => product._id !== heroId) || products[1];
  }, [products, heroProduct]);

  const heroRightBottomProduct = useMemo(() => {
    const blockedIds = new Set([heroProduct?._id, heroRightTopProduct?._id].filter(Boolean));
    const preferred = products.find((product) => {
      if (blockedIds.has(product._id)) return false;
      const name = product.name.toLowerCase();
      return (
        name.includes("sneaker") ||
        name.includes("shoe") ||
        name.includes("bag") ||
        name.includes("watch") ||
        name.includes("shirt") ||
        name.includes("dress")
      );
    });
    if (preferred) return preferred;
    return products.find((product) => !blockedIds.has(product._id)) || products[2];
  }, [products, heroProduct, heroRightTopProduct]);
  const latestProducts = useMemo(() => products.slice(0, 8), [products]);
  const goToProduct = (id?: string) => {
    if (!id) return;
    navigate(`/products/${id}`);
  };

  if (isLoadingProducts && isLoadingCategories && products.length === 0 && categories.length === 0) {
    return (
      <LoadingAnimation
        title="Loading Storefront"
        subtitle="Preparing categories, products, and featured highlights..."
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f3]">
      <main className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="relative min-h-[320px] overflow-hidden rounded-3xl sm:min-h-[420px]">
            {heroProduct?.images?.[0] ? (
              <img
                src={heroProduct.images[0]}
                alt={heroProduct.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gray-200" />
            )}
            <div className="absolute inset-0 bg-black/20" />

            <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8">
              <div className="max-w-[280px] space-y-5">
                <div className="flex items-end gap-3">
                  <p className="text-5xl font-black leading-none text-white sm:text-6xl">
                    50%
                  </p>
                  <p className="pb-2 text-2xl font-black uppercase tracking-wider text-white">
                    off
                  </p>
                </div>
                <p className="text-xl font-bold leading-tight text-white sm:text-2xl">
                  Discover quality fashion that reflects your style and make
                  everyday more enjoyable
                </p>
              </div>
              <div>
                <button
                  onClick={() => navigate("/products")}
                  className="rounded-2xl bg-black px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-gray-800"
                >
                  Explore Products
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <button
              type="button"
              onClick={() => goToProduct(heroRightTopProduct?._id)}
              className="group relative min-h-[170px] overflow-hidden rounded-3xl text-left"
            >
              {heroRightTopProduct?.images?.[0] ? (
                <img
                  src={heroRightTopProduct.images[0]}
                  alt={heroRightTopProduct.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gray-200" />
              )}
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative z-10 p-5">
                <p className="text-3xl font-black uppercase leading-none text-white sm:text-4xl">
                  {heroRightTopProduct?.name || "Featured"}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => goToProduct(heroRightBottomProduct?._id)}
              className="group relative min-h-[170px] overflow-hidden rounded-3xl text-left"
            >
              {heroRightBottomProduct?.images?.[0] ? (
                <img
                  src={heroRightBottomProduct.images[0]}
                  alt={heroRightBottomProduct.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gray-200" />
              )}
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative z-10 flex h-full items-end p-5">
                <p className="text-xl font-black uppercase text-white sm:text-2xl">
                  {heroRightBottomProduct?.name || "Featured Product"}
                </p>
              </div>
            </button>
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-gray-900">
              Explore Popular Categories
            </h2>
            <button
              onClick={() => navigate("/products")}
              className="flex items-center gap-1 text-xs font-semibold tracking-wide text-gray-500 transition-colors hover:text-gray-900"
            >
              VIEW ALL <ChevronRight size={14} />
            </button>
          </div>

          {isLoadingCategories && (
            <LoadingAnimation
              fullScreen={false}
              title="Loading Categories"
              subtitle="Preparing your category collection..."
            />
          )}
          {!isLoadingCategories && categoriesError && (
            <p className="text-sm text-red-600">{categoriesError}</p>
          )}
          {!isLoadingCategories && !categoriesError && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-8">
              {categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => {
                    if (category._id === "all") {
                      navigate("/products");
                      return;
                    }
                    navigate(`/products?categoryId=${category._id}`);
                  }}
                  className="group rounded-2xl bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mb-3 aspect-square overflow-hidden rounded-xl bg-gray-100">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-500">
                        No image
                      </div>
                    )}
                  </div>
                  <p className="line-clamp-2 text-xs font-semibold uppercase tracking-wide text-gray-800">
                    {category.name}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-gray-900">
              Latest Products
            </h2>
            <button
              onClick={() => navigate("/products")}
              className="flex items-center gap-1 text-xs font-semibold tracking-wide text-gray-500 transition-colors hover:text-gray-900"
            >
              VIEW ALL <ChevronRight size={14} />
            </button>
          </div>

          {isLoadingProducts && (
            <LoadingAnimation
              fullScreen={false}
              title="Loading Products"
              subtitle="Fetching the latest arrivals..."
            />
          )}
          {!isLoadingProducts && productsError && (
            <p className="text-sm text-red-600">{productsError}</p>
          )}
          {!isLoadingProducts &&
            !productsError &&
            latestProducts.length === 0 && (
              <p className="text-sm text-gray-600">No products found.</p>
            )}

          {!isLoadingProducts &&
            !productsError &&
            latestProducts.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {latestProducts.map((product) => (
                  <button
                    key={product._id}
                    onClick={() => navigate(`/products/${product._id}`)}
                    className="group flex h-full flex-col rounded-2xl bg-white p-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="mb-3 aspect-square overflow-hidden rounded-xl bg-gray-100">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-500">
                          No image
                        </div>
                      )}
                    </div>
                    <p className="line-clamp-2 text-sm font-semibold text-gray-900">
                      {product.name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                      {product.description}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <p className="text-sm font-bold text-gray-900">
                        LKR {product.price.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Stock: {product.stock}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
        </section>
      </main>
    </div>
  );
}
