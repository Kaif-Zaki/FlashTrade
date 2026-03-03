import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AxiosError } from "axios";
import { getProductsRequest } from "../service/productService.ts";
import type { Product } from "../types/Product";

const ProductList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filter = (searchParams.get("filter") || "").toLowerCase();
  const categoryId = searchParams.get("categoryId") || "";
  const searchQueryRaw = searchParams.get("q") || "";
  const searchQuery = searchQueryRaw.trim().toLowerCase();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(0);
  const [isPriceInitialized, setIsPriceInitialized] = useState(false);

  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const filterKeywords: Record<string, string[]> = {
    men: ["men", "mens", "male", "man"],
    women: ["women", "womens", "female", "lady", "ladies", "girl"],
    electronics: ["electronics", "electronic", "gadget", "device", "tech"],
    sneakers: ["sneaker", "sneakers", "shoe", "shoes", "footwear"],
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const result = await getProductsRequest();
        setProducts(result);
      } catch (err) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || "Failed to load products");
        } else {
          setError("Failed to load products");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  const displayProducts = products;

  const allCategories = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    displayProducts.forEach((product) => {
      if (product.category?._id && product.category?.name) {
        map.set(product.category._id, { id: product.category._id, name: product.category.name });
      }
    });
    return Array.from(map.values());
  }, [displayProducts]);

  const allColors = useMemo(() => {
    const unique = new Set<string>();
    displayProducts.forEach((product) => {
      (product.colors || []).forEach((color) => {
        if (color?.trim()) unique.add(color.trim());
      });
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [displayProducts]);

  const priceBounds = useMemo(() => {
    if (displayProducts.length === 0) return { min: 0, max: 0 };
    const prices = displayProducts.map((product) => product.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [displayProducts]);

  useEffect(() => {
    if (!isPriceInitialized && priceBounds.max > 0) {
      setMaxPrice(priceBounds.max);
      setIsPriceInitialized(true);
    }
  }, [isPriceInitialized, priceBounds.max]);

  useEffect(() => {
    if (categoryId) {
      setSelectedCategories([categoryId]);
    } else {
      setSelectedCategories([]);
    }
  }, [categoryId]);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleColor = (color: string) => {
    const normalized = color.trim().toLowerCase();
    setSelectedColors((prev) =>
      prev.includes(normalized) ? prev.filter((item) => item !== normalized) : [...prev, normalized]
    );
  };

  const clearFilters = () => {
    setSelectedCategories(categoryId ? [categoryId] : []);
    setSelectedColors([]);
    setMaxPrice(priceBounds.max);
  };

  const filteredProducts = useMemo(() => {
    let result = displayProducts;

    if (categoryId) {
      result = result.filter((product) => product.category?._id === categoryId);
    }

    if (filter && filterKeywords[filter]) {
      const keywords = filterKeywords[filter];
      result = result.filter((product) => {
        const normalizedName = normalizeText(product.name || "");
        const normalizedCategory = normalizeText(product.category?.name || "");
        return keywords.some((keyword) => {
          const normalizedKeyword = normalizeText(keyword);
          return (
            normalizedName.includes(normalizedKeyword) ||
            normalizedCategory.includes(normalizedKeyword)
          );
        });
      });
    }

    if (searchQuery) {
      result = result.filter((product) => {
        const name = product.name.toLowerCase();
        const description = product.description.toLowerCase();
        const category = product.category?.name?.toLowerCase() || "";
        return (
          name.includes(searchQuery) ||
          description.includes(searchQuery) ||
          category.includes(searchQuery)
        );
      });
    }

    if (selectedCategories.length > 0) {
      const selectedCategoryIdSet = new Set(selectedCategories.map((id) => id.trim().toLowerCase()));
      result = result.filter((product) =>
        selectedCategoryIdSet.has((product.category?._id || "").trim().toLowerCase())
      );
    }

    if (selectedColors.length > 0) {
      result = result.filter((product) =>
        (product.colors || []).some((color) => selectedColors.includes(color.trim().toLowerCase()))
      );
    }

    result = result.filter((product) => product.price <= maxPrice);

    return result;
  }, [displayProducts, filter, categoryId, searchQuery, selectedCategories, selectedColors, maxPrice]);

  const emptyCategoryLabel = useMemo(() => {
    if (categoryId) {
      const selected = allCategories.find((category) => category.id === categoryId);
      return selected?.name || "Selected";
    }
    if (filter) return filter.charAt(0).toUpperCase() + filter.slice(1);
    return "";
  }, [allCategories, categoryId, filter]);

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
            <button onClick={clearFilters} className="text-xs font-semibold text-gray-500 hover:text-gray-900">
              Clear
            </button>
          </div>

          <div className="mb-6">
            <p className="mb-2 text-sm font-semibold text-gray-900">Price Range</p>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-gray-600">Up to</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">LKR</span>
                  <input
                    type="number"
                    min={priceBounds.min}
                    max={priceBounds.max}
                    value={maxPrice}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setMaxPrice(Math.min(priceBounds.max, Math.max(priceBounds.min, value)));
                    }}
                    className="w-28 rounded-md border border-gray-300 bg-white px-2 py-1 text-right text-sm font-semibold text-gray-900 outline-none focus:border-gray-500"
                  />
                </div>
              </div>
              <p className="mt-2 text-lg font-bold text-gray-900">LKR {maxPrice.toLocaleString()}</p>
              <div className="mt-3">
                <input
                  type="range"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  value={maxPrice}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setMaxPrice(value);
                  }}
                  className="w-full accent-gray-900"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                <span>LKR {priceBounds.min.toLocaleString()}</span>
                <span>LKR {priceBounds.max.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="mb-2 text-sm font-semibold text-gray-900">Item Category</p>
            <div className="space-y-2">
              {allCategories.map((category) => (
                <label key={category.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    className="h-4 w-4 accent-gray-900"
                  />
                  {category.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-gray-900">Colors</p>
            <div className="space-y-2">
              {allColors.map((color) => (
                <label key={color} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedColors.includes(color.trim().toLowerCase())}
                    onChange={() => toggleColor(color)}
                    className="h-4 w-4 accent-gray-900"
                  />
                  {color}
                </label>
              ))}
              {allColors.length === 0 && <p className="text-sm text-gray-500">No colors available</p>}
            </div>
          </div>
        </aside>

        <section>
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {categoryId
                ? "Category Products"
                : searchQuery
                ? `Search Results for "${searchQueryRaw}"`
                : filter === "men"
                ? "Men Products"
                : "Product List"}
            </h1>
            <button
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm transition-colors duration-200 hover:bg-gray-900 hover:text-white"
            >
              <ArrowLeft size={18} />
            </button>
          </div>

          {isLoading && <p className="text-sm text-gray-600">Loading products...</p>}
          {!isLoading && error && <p className="text-sm text-red-600">{error}</p>}
          {!isLoading && !error && filteredProducts.length === 0 && (
            <p className="text-sm text-gray-600">
              {categoryId || filter
                ? `${emptyCategoryLabel} category item not available.`
                : "No products available."}
            </p>
          )}

          {!isLoading && !error && filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <button
                  key={product._id}
                  onClick={() => navigate(`/products/${product._id}`)}
                  className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                <div className="relative aspect-square overflow-hidden bg-gray-50">
                  {product.stock <= 0 && (
                    <span className="absolute left-2 top-2 z-10 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Out of stock
                    </span>
                  )}
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-500">No image</div>
                  )}
                </div>
                  <div className="flex flex-1 flex-col p-3.5">
                    <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-gray-800">
                      {product.name}
                    </h3>
                    <p className="mb-3 line-clamp-2 text-xs text-gray-500">{product.description}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900">LKR {product.price.toLocaleString()}</p>
                      <p className={`text-[11px] ${product.stock <= 0 ? "font-semibold text-red-600" : "text-gray-500"}`}>
                        {product.stock <= 0 ? "Out of stock" : `Stock: ${product.stock}`}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProductList;
