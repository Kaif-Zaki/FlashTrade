import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { getProfileRequest } from "../service/authService";
import { getCartRequest } from "../service/cartService";
import { placeOrderRequest } from "../service/orderService";
import type { CartResponse } from "../types/Cart";
import type { CheckoutDraft } from "../types/Order";

const STORAGE_KEY = "checkout_draft";
const DISCOUNT_RATE = 0.2;
const DELIVERY_FEE = 15;

type Tab = "customer" | "payment";

const CheckoutPayment = () => {
  const navigate = useNavigate();
  const [activeTab] = useState<Tab>("payment");
  const [cart, setCart] = useState<CartResponse>({ items: [] });
  const [draft, setDraft] = useState<CheckoutDraft | null>(null);
  const [form, setForm] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const init = async () => {
      const draftRaw = sessionStorage.getItem(STORAGE_KEY);
      if (!draftRaw) {
        navigate("/checkout/customer-details");
        return;
      }

      let parsedDraft: CheckoutDraft;
      try {
        parsedDraft = JSON.parse(draftRaw) as CheckoutDraft;
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
        navigate("/checkout/customer-details");
        return;
      }

      setDraft(parsedDraft);

      try {
        await getProfileRequest();
        const cartData = await getCartRequest();
        setCart(cartData);

        if (cartData.items.length === 0) {
          setError("Your cart is empty");
        }
      } catch (err) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || "Failed to load payment details");
        } else {
          setError("Failed to load payment details");
        }
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === "cardNumber") value = value.replace(/[^0-9 ]/g, "").slice(0, 19);
    if (name === "expiry") {
      value = value.replace(/[^0-9]/g, "");
      if (value.length >= 3) value = value.slice(0, 2) + " / " + value.slice(2, 4);
    }
    if (name === "cvv") value = value.replace(/[^0-9]/g, "").slice(0, 3);
    setForm({ ...form, [name]: value });
  };

  const subtotal = useMemo(
    () => cart.items.reduce((sum, item) => sum + item.product.price * item.qty, 0),
    [cart.items]
  );
  const discount = Math.round(subtotal * DISCOUNT_RATE);
  const total = subtotal - discount + (cart.items.length > 0 ? DELIVERY_FEE : 0);

  const handlePay = async () => {
    if (!draft) {
      setError("Checkout details are missing");
      return;
    }

    if (cart.items.length === 0) {
      setError("Your cart is empty");
      return;
    }

    if (draft.paymentMethod === "online") {
      const digitsOnlyCard = form.cardNumber.replace(/\s/g, "");
      if (digitsOnlyCard.length < 12 || !form.expiry || form.cvv.length < 3) {
        setError("Enter valid card number, expiry and CVV");
        return;
      }
    }

    if (draft.paymentMethod === "cash" && !draft.mobile) {
      setError("Mobile number is required for cash on delivery");
      return;
    }

    setIsPaying(true);
    setError("");

    try {
      const shippingAddress = [draft.address, draft.postalCode].filter(Boolean).join(", ");
      const order = await placeOrderRequest({
        shippingAddress,
        paymentMethod: draft.paymentMethod,
      });

      sessionStorage.removeItem(STORAGE_KEY);
      setSuccess(`Order placed successfully. Order ID: ${order._id}`);
      setTimeout(() => navigate("/products"), 1200);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Payment failed");
      } else {
        setError("Payment failed");
      }
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-8 tracking-tight">Checkout</h1>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        {success && <p className="mb-4 text-sm text-green-700">{success}</p>}

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 pr-0 lg:pr-8">
            <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-gray-300">
              <button
                onClick={() => navigate("/checkout/customer-details")}
                className="flex items-center gap-2 pb-3 pr-4 text-xs font-semibold transition-colors duration-200 border-b-2 -mb-px border-transparent text-gray-400 hover:text-gray-600 sm:pr-10 sm:text-sm"
              >
                Customer Information
              </button>

              <button
                className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold transition-colors duration-200 border-b-2 -mb-px sm:px-6 sm:text-sm ${
                  activeTab === "payment" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"
                }`}
              >
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-gray-900">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                </div>
                Payment Details
              </button>
            </div>

            <div className="max-w-full space-y-5 sm:max-w-sm">
              {draft?.paymentMethod === "online" ? (
                <>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block tracking-wide">Card Number</label>
                    <input
                      name="cardNumber"
                      value={form.cardNumber}
                      onChange={handleChange}
                      className="w-full border-2 border-blue-500 rounded-xl px-4 py-3.5 text-sm bg-white focus:outline-none focus:border-blue-600 transition-colors"
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block tracking-wide">Expiry Date [MM / YY]</label>
                    <input
                      name="expiry"
                      value={form.expiry}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-sm bg-white focus:outline-none focus:border-blue-500 focus:border-2 transition-colors"
                      maxLength={7}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block tracking-wide">CVV</label>
                    <input
                      name="cvv"
                      value={form.cvv}
                      onChange={handleChange}
                      type="password"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-sm bg-white focus:outline-none focus:border-blue-500 focus:border-2 transition-colors"
                      maxLength={3}
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-gray-300 bg-white p-4 text-sm text-gray-700">
                  Cash on Delivery selected. Click the button below to place your order.
                </div>
              )}

              {draft && (
                <p className="text-xs text-gray-500">
                  Payment method selected: <span className="font-semibold text-gray-700">{draft.paymentMethod}</span>
                </p>
              )}
            </div>
          </div>

          <div className="hidden lg:block w-px bg-gray-300 self-stretch mx-2" />

          <div className="mt-2 lg:mt-0 lg:w-72 lg:pl-6 xl:w-80">
            <div className="flex flex-col justify-between rounded-2xl bg-gray-900 p-6 text-white sm:p-7">
              <div>
                <h2 className="text-xl font-bold mb-1 tracking-tight">Current Order</h2>
                <p className="text-xs text-gray-400 mb-8">The sum of all total payment for items</p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Subtotal</span>
                    <span className="text-sm font-semibold">
                      {isLoading ? "..." : `LKR ${subtotal.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Discount (-20%)</span>
                    <span className="text-sm font-semibold text-red-400">
                      {isLoading ? "..." : `LKR -${discount.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Delivery Fee</span>
                    <span className="text-sm font-semibold">
                      {isLoading
                        ? "..."
                        : `LKR ${(cart.items.length > 0 ? DELIVERY_FEE : 0).toLocaleString()}`}
                    </span>
                  </div>
                  <div className="border-t border-gray-700 pt-4 flex items-center justify-between">
                    <span className="font-bold text-white">Total</span>
                    <span className="font-bold text-white">{isLoading ? "..." : `LKR ${total.toLocaleString()}`}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePay}
                disabled={isPaying || isLoading || cart.items.length === 0 || Boolean(success)}
                className={`mt-10 w-full py-4 rounded-full text-sm font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                  success
                    ? "bg-green-400 text-white"
                    : isPaying
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-white text-gray-900 hover:bg-gray-200"
                }`}
              >
                {success
                  ? "Order Completed"
                  : isPaying
                  ? "Processing..."
                  : draft?.paymentMethod === "cash"
                  ? "Place Order"
                  : `Pay LKR ${total.toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPayment;
