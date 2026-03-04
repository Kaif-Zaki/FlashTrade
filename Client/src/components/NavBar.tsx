import { useEffect, useMemo, useState } from "react";
import { Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.ts";
import { getCartRequest } from "../service/cartService.ts";
import { getProductsRequest } from "../service/productService.ts";
import { getCategoriesRequest } from "../service/categoryService.ts";
import type { Product } from "../types/Product.ts";
import type { Category } from "../types/Category.ts";
import vexoLogo from "../assets/VexoLogo.png";

export default function Navbar() {
  const { isLoggedIn, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const filter = (searchParams.get("filter") || "").toLowerCase();
  const activeCategoryId = searchParams.get("categoryId") || "";
  const isProductsPage = location.pathname === "/products";
  const [cartCount, setCartCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const matchedProducts = useMemo(() => {
    if (!normalizedSearch) return [];
    return allProducts
      .filter((product) => product.name.toLowerCase().includes(normalizedSearch))
      .slice(0, 6);
  }, [allProducts, normalizedSearch]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const result = await getProductsRequest();
        setAllProducts(result);
      } catch {
        setAllProducts([]);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await getCategoriesRequest();
        setAllCategories(result);
      } catch {
        setAllCategories([]);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadCartCount = async () => {
      if (!isLoggedIn) {
        setCartCount(0);
        return;
      }

      try {
        const cart = await getCartRequest();
        const totalQty = cart.items.reduce((sum, item) => sum + item.qty, 0);
        setCartCount(totalQty);
      } catch {
        setCartCount(0);
      }
    };

    loadCartCount();

    const onCartUpdated = () => {
      loadCartCount();
    };
    window.addEventListener("cart-updated", onCartUpdated);
    return () => {
      window.removeEventListener("cart-updated", onCartUpdated);
    };
  }, [isLoggedIn, location.pathname, location.search]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowSuggestions(false);
  }, [location.pathname, location.search]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (!query) {
      navigate("/products");
      setShowSuggestions(false);
      return;
    }
    navigate(`/products?q=${encodeURIComponent(query)}`);
    setShowSuggestions(false);
  };

  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  const tokenizeText = (value: string) =>
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((token) => normalizeText(token))
      .filter(Boolean);

  const findCategoryIdByNames = (names: string[]) => {
    const normalizedNames = names.map((name) => normalizeText(name));
    const found = allCategories.find((category) => {
      const normalizedCategory = normalizeText(category.name || "");
      const categoryTokens = tokenizeText(category.name || "");
      return normalizedNames.some(
        (name) =>
          normalizedCategory === name ||
          categoryTokens.includes(name) ||
          normalizedCategory.startsWith(name) ||
          (name.length >= 4 && normalizedCategory.includes(name))
      );
    });
    return found?._id || "";
  };

  const menCategoryId = findCategoryIdByNames(["men", "mens", "male"]);
  const womenCategoryId = findCategoryIdByNames(["women", "womens", "ladies", "female"]);
  const electronicsCategoryId = findCategoryIdByNames(["electronics", "electronic"]);
  const sneakersCategoryId = findCategoryIdByNames(["sneakers", "sneaker", "footwear", "shoes", "shoe"]);

  const menLink = menCategoryId ? `/products?categoryId=${menCategoryId}` : "/products?filter=men";
  const womenLink = womenCategoryId ? `/products?categoryId=${womenCategoryId}` : "/products?filter=women";
  const electronicsLink = electronicsCategoryId ? `/products?categoryId=${electronicsCategoryId}` : "/products?filter=electronics";
  const sneakersLink = sneakersCategoryId ? `/products?categoryId=${sneakersCategoryId}` : "/products?filter=sneakers";

  return (
    <header className="w-full bg-[#f5f5f3] dark:bg-slate-900">
      <div className="px-4 py-3 sm:px-6 lg:hidden">
        <div className="flex flex-col gap-3">
          <Link to="/" className="flex items-center">
            <img src={vexoLogo} alt="Vexo" className="h-8 w-auto" />
          </Link>

          <div className="flex w-full items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              {isLoggedIn && userRole === "customer" && (
                <Link
                  to="/cart"
                  className="relative inline-flex items-center text-slate-800 dark:text-slate-200"
                  aria-label="Cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[9px] font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}

              {isLoggedIn && (
                <Link
                  to="/private-details"
                  aria-label="Private Details"
                  className="inline-flex items-center text-slate-800 dark:text-slate-200"
                >
                  <User className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full bg-gray-100 py-2.5 pl-5 pr-10 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-100"
            />
            <button type="submit" className="absolute right-4 top-2.5 text-gray-500 dark:text-slate-300">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Close menu overlay"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-[82%] max-w-xs overflow-y-auto bg-white p-5 shadow-xl dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <img src={vexoLogo} alt="Vexo" className="h-8 w-auto" />
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg border border-slate-300 p-2 text-slate-800 dark:border-slate-700 dark:text-slate-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-1">
              <MobileNavLink to="/" label="Home" onNavigate={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink to="/products" label="All Category" onNavigate={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink to={menLink} label="Men" onNavigate={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink to={womenLink} label="Women" onNavigate={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink to={electronicsLink} label="Electronics" onNavigate={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink to={sneakersLink} label="Sneakers" onNavigate={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink to="/contact" label="Contact Us" onNavigate={() => setIsMobileMenuOpen(false)} />
              {isLoggedIn && userRole === "customer" && (
                <MobileNavLink to="/orders" label="Order History" onNavigate={() => setIsMobileMenuOpen(false)} />
              )}
            </nav>

            <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-700">
              {isLoggedIn ? (
                <div className="space-y-2">
                  {userRole === "customer" && (
                    <MobileNavLink to="/cart" label={`Cart (${cartCount})`} onNavigate={() => setIsMobileMenuOpen(false)} />
                  )}
                  <MobileNavLink to="/private-details" label="Private Details" onNavigate={() => setIsMobileMenuOpen(false)} />
                </div>
              ) : (
                <div className="space-y-2">
                  <MobileNavLink to="/login" label="Login" onNavigate={() => setIsMobileMenuOpen(false)} />
                  <MobileNavLink to="/signup" label="Signup" onNavigate={() => setIsMobileMenuOpen(false)} />
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* TOP BAR */}
      <div className="hidden flex-col gap-3 px-4 py-3 sm:px-6 lg:flex lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-4">
        {/* LOGO */}
        <Link to="/" className="flex items-center">
          <img src={vexoLogo} alt="Vexo" className="h-8 w-auto sm:h-9" />
        </Link>

        {/* SEARCH */}
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-[420px]">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 120);
            }}
            className="w-full rounded-full bg-gray-100 py-2.5 pl-5 pr-10 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-100"
          />
          <button type="submit" className="absolute right-4 top-2.5 text-gray-500 dark:text-slate-300">
            <Search className="h-5 w-5" />
          </button>

          {showSuggestions && normalizedSearch && (
            <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {matchedProducts.length > 0 ? (
                <div className="py-1">
                  {matchedProducts.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => {
                        setShowSuggestions(false);
                        navigate(`/products/${product._id}`);
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {product.name}
                    </button>
                  ))}
                  <button
                    type="submit"
                    className="block w-full border-t border-gray-100 px-4 py-2 text-left text-sm font-semibold text-blue-600 hover:bg-gray-100 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Search for "{searchTerm.trim()}"
                  </button>
                </div>
              ) : (
                <p className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">No matching products</p>
              )}
            </div>
          )}
        </form>

        {/* RIGHT */}
        <div className="flex items-center gap-5 self-end sm:gap-6 lg:self-auto">
          {isLoggedIn ? (
            <>
              {userRole === "customer" && (
                <Link
                  to="/cart"
                  className="flex items-center font-medium hover:text-blue-600"
                  aria-label="Cart"
                  title="Cart"
                >
                  <span className="relative inline-flex">
                    <ShoppingCart className="h-6 w-6" />
                    {cartCount > 0 && (
                      <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">
                        {cartCount}
                      </span>
                    )}
                  </span>
                </Link>
              )}
              <Link
                to="/private-details"
                aria-label="Private Details"
                title="Private Details"
                className="flex items-center font-medium hover:text-blue-600"
              >
                <User className="h-5 w-5" />
              </Link>
            </>
          ) : (
            <>
                <Link to="/login" className="font-medium text-slate-800 hover:text-blue-600 dark:text-slate-200">
                  Login
                </Link>
                <Link to="/signup" className="font-medium text-slate-800 hover:text-blue-600 dark:text-slate-200">
                  Signup
                </Link>
            </>
          )}
        </div>
      </div>

      {/* BOTTOM NAV */}
      <nav className="no-scrollbar hidden overflow-x-auto px-4 pb-3 pt-2 sm:px-6 lg:block lg:px-10 lg:py-4">
        <div className="flex w-max min-w-full items-center justify-start gap-6 text-xs font-medium uppercase tracking-wide sm:justify-center sm:gap-8 sm:text-sm lg:gap-10">
          <Link to="/">
            <NavItem text="Home" active={location.pathname === "/"} />
          </Link>
          <Link to="/products">
            <NavItem text="All Category" active={isProductsPage && !filter && !activeCategoryId} />
          </Link>
          <Link to={menLink}>
            <NavItem
              text="Men"
              active={
                isProductsPage &&
                ((!!activeCategoryId && !!menCategoryId && activeCategoryId === menCategoryId) ||
                  (!menCategoryId && filter === "men"))
              }
            />
          </Link>
          <Link to={womenLink}>
            <NavItem
              text="Women"
              active={
                isProductsPage &&
                ((!!activeCategoryId && !!womenCategoryId && activeCategoryId === womenCategoryId) ||
                  (!womenCategoryId && filter === "women"))
              }
            />
          </Link>
          <Link to={electronicsLink}>
            <NavItem
              text="Electronics"
              active={
                isProductsPage &&
                ((!!activeCategoryId &&
                  !!electronicsCategoryId &&
                  activeCategoryId === electronicsCategoryId) ||
                  (!electronicsCategoryId && filter === "electronics"))
              }
            />
          </Link>
          <Link to={sneakersLink}>
            <NavItem
              text="Sneakers"
              active={
                isProductsPage &&
                ((!!activeCategoryId && !!sneakersCategoryId && activeCategoryId === sneakersCategoryId) ||
                  (!sneakersCategoryId && filter === "sneakers"))
              }
            />
          </Link>
          <Link to="/contact">
            <NavItem text="Contact Us" active={location.pathname === "/contact"} />
          </Link>
          {isLoggedIn && userRole === "customer" && (
            <Link to="/orders">
              <NavItem text="Order History" active={location.pathname === "/orders"} />
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

function MobileNavLink({
  to,
  label,
  onNavigate,
}: {
  to: string;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
    >
      {label}
    </Link>
  );
}

function NavItem({
  text,
  active = false,
  icon = false,
}: {
  text: string;
  active?: boolean;
  icon?: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 items-center gap-2 cursor-pointer transition-colors hover:text-blue-600 ${
        active ? "text-blue-700 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"
      }`}
    >
      {icon && (
        <div className="grid grid-cols-2 gap-0.5">
          <span className="h-2 w-2 border" />
          <span className="h-2 w-2 border" />
          <span className="h-2 w-2 border" />
          <span className="h-2 w-2 border" />
        </div>
      )}
      {text}
    </div>
  );
}
