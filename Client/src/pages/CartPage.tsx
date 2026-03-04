import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import {
  addToCartRequest,
  getCartRequest,
  removeFromCartRequest,
} from "../service/cartService";
import type { CartResponse } from "../types/Cart";
import LoadingAnimation from "../components/Loading";

const DISCOUNT_RATE = 0.2;
const DELIVERY_FEE = 15;

const ShoppingCart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartResponse>({ items: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyItemKey, setBusyItemKey] = useState<string>("");

  const getItemKey = (productId: string, size?: string, color?: string) =>
    `${productId}__${size || ""}__${color || ""}`;
  const getUnitPrice = (item: CartResponse["items"][number]) => {
    const sizePrice = item.size ? item.product.sizePrices?.[item.size] : undefined;
    return Number.isFinite(sizePrice) ? Number(sizePrice) : item.product.price;
  };

  const loadCart = async () => {
    const data = await getCartRequest();
    setCart(data);
  };

  useEffect(() => {
    const init = async () => {
      setCart({ items: [] });
      setError("");
      setIsLoading(true);
      try {
        await loadCart();
      } catch (err) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || "Failed to load cart");
        } else {
          setError("Failed to load cart");
        }
      } finally {
        setIsLoading(false);
      }
    };

    init();
    const onAuthUpdated = () => {
      init();
    };
    window.addEventListener("auth-updated", onAuthUpdated);
    return () => {
      window.removeEventListener("auth-updated", onAuthUpdated);
    };
  }, []);

  const updateQty = async (productId: string, currentQty: number, nextQty: number, size?: string, color?: string) => {
    if (nextQty < 0) return;
    const itemKey = getItemKey(productId, size, color);
    setBusyItemKey(itemKey);
    setError("");

    try {
      if (nextQty === 0) {
        await removeFromCartRequest(productId, size, color);
      } else if (nextQty > currentQty) {
        await addToCartRequest({
          product: productId,
          qty: nextQty - currentQty,
          size,
          color,
        });
      } else {
        await removeFromCartRequest(productId, size, color);
        await addToCartRequest({
          product: productId,
          qty: nextQty,
          size,
          color,
        });
      }
      await loadCart();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to update cart");
      } else {
        setError("Failed to update cart");
      }
    } finally {
      setBusyItemKey("");
    }
  };

  const removeItem = async (productId: string, size?: string, color?: string) => {
    const itemKey = getItemKey(productId, size, color);
    setBusyItemKey(itemKey);
    setError("");

    try {
      await removeFromCartRequest(productId, size, color);
      await loadCart();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to remove item");
      } else {
        setError("Failed to remove item");
      }
    } finally {
      setBusyItemKey("");
    }
  };

  const subtotal = useMemo(
    () => cart.items.reduce((sum, item) => sum + getUnitPrice(item) * item.qty, 0),
    [cart.items]
  );
  const discount = Math.round(subtotal * DISCOUNT_RATE);
  const total = subtotal - discount + (cart.items.length > 0 ? DELIVERY_FEE : 0);

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Shopping Cart</h1>
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full border-2 border-gray-800 flex items-center justify-center hover:bg-gray-900 hover:text-white transition-colors duration-200 text-gray-800"
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 bg-gray-200 rounded-2xl p-5 shadow-sm">
            {isLoading ? (
              <LoadingAnimation
                fullScreen={false}
                title="Loading Cart"
                subtitle="Syncing your selected items..."
              />
            ) : cart.items.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-lg font-semibold">Your cart is empty</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-300">
                {cart.items.map((item) => {
                  const itemKey = getItemKey(item.product._id, item.size, item.color);
                  return (
                  <div key={itemKey} className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row">
                    <div className="h-40 w-full overflow-hidden rounded-xl bg-white sm:h-24 sm:w-28 sm:flex-shrink-0">
                      {item.product.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-500">No image</div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900 underline underline-offset-2 text-base leading-tight">
                            {item.product.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">Size: {item.size || "-"}</p>
                          <p className="text-sm text-gray-500">Colour: {item.color || "-"}</p>
                          <p className="text-xs text-gray-500">Available stock: {item.product.stock}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.product._id, item.size, item.color)}
                          disabled={busyItemKey === itemKey}
                          className="text-red-500 hover:text-red-700 transition-colors mt-0.5 disabled:opacity-60"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-base font-bold tracking-wide text-gray-900">
                          LKR {(getUnitPrice(item) * item.qty).toLocaleString()}
                        </span>
                        <div className="flex items-center gap-3 bg-white rounded-xl px-3 py-1.5 shadow-sm">
                          <button
                            onClick={() => updateQty(item.product._id, item.qty, item.qty - 1, item.size, item.color)}
                            disabled={busyItemKey === itemKey}
                            className="text-gray-700 font-bold text-lg leading-none hover:text-red-500 transition-colors w-5 text-center disabled:opacity-60"
                          >
                            -
                          </button>
                          <span className="text-sm font-bold w-4 text-center text-gray-900">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.product._id, item.qty, item.qty + 1, item.size, item.color)}
                            disabled={busyItemKey === itemKey || item.qty >= item.product.stock}
                            className="text-gray-700 font-bold text-lg leading-none hover:text-green-600 transition-colors w-5 text-center disabled:opacity-60"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>

          <div className="lg:w-72 xl:w-80 bg-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold text-center text-gray-900 mb-8 tracking-wide">Order Summary</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Subtotal</span>
                  <span className="font-semibold text-sm text-gray-900">LKR {subtotal.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Discount (-20%)</span>
                  <span className="font-semibold text-sm text-red-500">LKR -{discount.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Delivery Fee</span>
                  <span className="font-semibold text-sm text-gray-900">
                    LKR {(cart.items.length > 0 ? DELIVERY_FEE : 0).toLocaleString()}
                  </span>
                </div>

                <div className="border-t border-gray-300 pt-4 flex items-center justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">LKR {total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate("/checkout/customer-details")}
              disabled={cart.items.length === 0 || isLoading}
              className="mt-8 w-full bg-gray-900 text-white rounded-full py-4 flex items-center justify-center gap-3 font-bold tracking-wide hover:bg-gray-700 transition-colors duration-200 group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>Go To Checkout</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;
