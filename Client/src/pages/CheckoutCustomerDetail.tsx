import { useEffect, useMemo, useState } from "react";
import { User, MapPin, CreditCard, Truck, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { getProfileRequest } from "../service/authService";
import { getCartRequest } from "../service/cartService";
import type { CartResponse } from "../types/Cart";
import type { CheckoutDraft, PaymentMethod } from "../types/Order";
import LoadingAnimation from "../components/Loading";

const STORAGE_KEY = "checkout_draft";
const DISCOUNT_RATE = 0.2;
const DELIVERY_FEE = 15;

type Tab = "customer" | "payment";

const Checkout = () => {
  const navigate = useNavigate();
  const [activeTab] = useState<Tab>("customer");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online");
  const [cart, setCart] = useState<CartResponse>({ items: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<CheckoutDraft>({
    firstName: "",
    lastName: "",
    mobile: "",
    postalCode: "",
    address: "",
    paymentMethod: "online",
  });

  useEffect(() => {
    const draftRaw = sessionStorage.getItem(STORAGE_KEY);
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw) as CheckoutDraft;
        setForm(draft);
        setPaymentMethod(draft.paymentMethod || "online");
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const profile = await getProfileRequest();

        if (!sessionStorage.getItem(STORAGE_KEY)) {
          const [firstName, ...rest] = profile.name.trim().split(" ");
          setForm((prev) => ({
            ...prev,
            firstName: firstName || "",
            lastName: rest.join(" "),
            address: profile.address || "",
          }));
        }

        const cartData = await getCartRequest();
        setCart(cartData);
      } catch (err) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || "Failed to load checkout details");
        } else {
          setError("Failed to load checkout details");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value, paymentMethod });
  };

  const subtotal = useMemo(
    () => cart.items.reduce((sum, item) => sum + item.product.price * item.qty, 0),
    [cart.items]
  );
  const discount = Math.round(subtotal * DISCOUNT_RATE);
  const total = subtotal - discount + (cart.items.length > 0 ? DELIVERY_FEE : 0);

  const goToPayment = () => {
    const updated: CheckoutDraft = { ...form, paymentMethod };

    if (!updated.firstName || !updated.mobile || !updated.address) {
      setError("First name, mobile number and address are required");
      return;
    }

    if (cart.items.length === 0) {
      setError("Your cart is empty");
      return;
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    navigate("/checkout/payment");
  };

  if (isLoading) {
    return (
      <LoadingAnimation
        title="Loading Checkout"
        subtitle="Preparing your customer details and cart summary..."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-8 tracking-tight">Checkout</h1>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            <div className="mb-7 flex flex-wrap items-center gap-2 border-b border-gray-300">
              <button
                className={`flex items-center gap-2 pb-3 pr-4 text-xs font-semibold transition-colors duration-200 border-b-2 -mb-px sm:pr-8 sm:text-sm ${
                  activeTab === "customer" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"
                }`}
              >
                <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-gray-900" />
                </div>
                Customer Information
              </button>
              <button
                onClick={() => navigate("/checkout/payment")}
                className="flex items-center gap-2 pb-3 px-4 text-xs font-semibold transition-colors duration-200 border-b-2 -mb-px border-transparent text-gray-400 hover:text-gray-600 sm:px-8 sm:text-sm"
              >
                Payment Details
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1.5 mb-1.5">
                    <User size={12} />
                    First Name
                  </label>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-gray-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1.5 mb-1.5">
                    <User size={12} />
                    Last Name
                  </label>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-gray-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Mobile Number</label>
                  <input
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-gray-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Postal Code</label>
                  <input
                    name="postalCode"
                    value={form.postalCode}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-gray-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 flex items-center gap-1.5 mb-1.5">
                  <MapPin size={12} />
                  Delivery Address
                </label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={5}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-gray-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-2">
                <p className="text-sm font-bold text-gray-900 mb-1">Payment Method</p>
                <p className="text-xs text-gray-400 mb-4">Select the payment method</p>

                <label
                  className={`flex items-center justify-between w-full border rounded-xl px-4 py-3.5 mb-3 cursor-pointer transition-all duration-200 ${
                    paymentMethod === "cash" ? "border-gray-900 bg-white" : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Truck size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Cash On Delivery</span>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    className="hidden"
                    checked={paymentMethod === "cash"}
                    onChange={() => setPaymentMethod("cash")}
                  />
                </label>

                <label
                  className={`flex items-center justify-between w-full border rounded-xl px-4 py-3.5 cursor-pointer transition-all duration-200 ${
                    paymentMethod === "online"
                      ? "border-gray-900 bg-white"
                      : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Online Payment (Credit/Debit Card)</span>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    className="hidden"
                    checked={paymentMethod === "online"}
                    onChange={() => setPaymentMethod("online")}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="hidden lg:block w-px bg-gray-300 self-stretch" />

          <div className="lg:w-72 xl:w-80">
            <div className="flex min-h-80 flex-col justify-between rounded-2xl bg-gray-900 p-6 text-white sm:p-7">
              <div>
                <h2 className="text-xl font-bold mb-1 tracking-tight">Current Order</h2>
                <p className="text-xs text-gray-400 mb-8">The sum of all total payment for items</p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Subtotal</span>
                    <span className="text-sm font-semibold">
                      {`LKR ${subtotal.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Discount (-20%)</span>
                    <span className="text-sm font-semibold text-red-400">
                      {`LKR -${discount.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Delivery Fee</span>
                    <span className="text-sm font-semibold">
                      {`LKR ${(cart.items.length > 0 ? DELIVERY_FEE : 0).toLocaleString()}`}
                    </span>
                  </div>
                  <div className="border-t border-gray-700 pt-4 flex items-center justify-between">
                    <span className="font-bold text-white">Total</span>
                    <span className="font-bold text-white">
                      {`LKR ${total.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-10">
                <button
                  onClick={goToPayment}
                  className="w-12 h-12 rounded-full bg-white text-gray-900 flex items-center justify-center hover:bg-gray-200 transition-colors duration-200 shadow-lg"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
