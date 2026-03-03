import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { useAuth } from "../context/useAuth.ts";
import { loginRequest, signupRequest } from "../service/authService.ts";
import { USER_ROLES, type UserRole } from "../types/Auth.ts";

const REGISTER_BG_URL =
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2200&q=80";

export const RegisterPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(USER_ROLES.CUSTOMER);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const getDefaultPathByRole = (
    userRole: UserRole,
    sellerApproved?: boolean,
    sellerActive?: boolean
  ) => {
    if (userRole === USER_ROLES.ADMIN) return "/admin/analytics";
    if (userRole === USER_ROLES.SELLER) {
      if (sellerApproved === false || sellerActive === false) return "/seller/approval-required";
      return "/seller/analytics";
    }
    return "/dashboard";
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const name = `${firstName} ${lastName}`.trim();
    if (!name) {
      setError("Name is required");
      setIsSubmitting(false);
      return;
    }

    try {
      await signupRequest({ name, email, password, address, role });
      const loginRes = await loginRequest({ email, password });
      login(loginRes.accessToken, loginRes.role, loginRes.sellerApproved, loginRes.sellerActive);
      navigate(getDefaultPathByRole(loginRes.role, loginRes.sellerApproved, loginRes.sellerActive));
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Signup failed");
      } else {
        setError("Signup failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${REGISTER_BG_URL})` }}
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center p-3 sm:p-5">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/40 bg-[#f5f5f3]/95 shadow-2xl backdrop-blur-md lg:grid-cols-2">
          <section className="relative hidden h-full lg:flex lg:flex-col lg:justify-between lg:bg-[#1f1f1f] lg:p-8 lg:text-white">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-300">FlashTrade</p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight">Join FlashTrade and shop with confidence.</h2>
              <p className="mt-3 text-sm text-gray-200">
                Create your account once and enjoy easy shopping, order tracking, and support.
              </p>
            </div>
            <div className="grid gap-2 text-xs text-gray-100">
              <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">Great products from trusted sellers</div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">Quick checkout and secure payments</div>
            </div>
          </section>

          <section className="flex h-full items-start justify-center p-4 sm:p-5 lg:items-center lg:p-7">
            <div className="w-full max-w-sm">
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Create your account</h1>
              <p className="mt-1 text-sm text-slate-600">Let’s get you ready to explore and shop.</p>

              <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-slate-800">
                      First name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-slate-800">
                      Last name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-800">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-slate-800">
                    Address
                  </label>
                  <input
                    id="address"
                    type="text"
                    placeholder="Your address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
                  />
                </div>

                <div>
                  <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-slate-800">
                    Account type
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
                  >
                    <option value={USER_ROLES.CUSTOMER}>Customer</option>
                    <option value={USER_ROLES.SELLER}>Seller</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-800">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {isSubmitting ? "Creating your account..." : "Create My Account"}
                </button>
              </form>

              <p className="mt-3.5 text-sm text-slate-700">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-gray-900 hover:text-black">
                  Login
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
