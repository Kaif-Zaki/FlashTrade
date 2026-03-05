import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.ts";
import { loginRequest } from "../service/authService.ts";
import { AxiosError } from "axios";

const LOGIN_BG_URL =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2200&q=80";

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const getDefaultPathByRole = (
    role: "customer" | "seller" | "admin",
    sellerApproved?: boolean,
    sellerActive?: boolean
  ) => {
    if (role === "admin") return "/admin/analytics";
    if (role === "seller") {
      if (sellerApproved === false || sellerActive === false) return "/seller/approval-required";
      return "/seller/analytics";
    }
    return "/dashboard";
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await loginRequest({ email, password });
      login(response.accessToken, response.role, response.sellerApproved, response.sellerActive);
      navigate(getDefaultPathByRole(response.role, response.sellerApproved, response.sellerActive));
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Login failed");
      } else {
        setError("Login failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${LOGIN_BG_URL})` }}
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center p-3 sm:p-5">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/40 bg-[#f5f5f3]/95 shadow-2xl backdrop-blur-md md:grid-cols-2">
          <section className="relative hidden h-full md:flex md:flex-col md:justify-between md:bg-[#1f1f1f] md:p-7 md:text-white">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-300">FlashTrade</p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight">
                Your favorite products are waiting for you.
              </h2>
              <p className="mt-3 text-sm text-gray-200">
                Discover trusted sellers, smooth checkout, and fast delivery in one app.
              </p>
            </div>
            <div className="grid gap-2 text-xs text-gray-100">
              <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">Daily deals and new arrivals</div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">Safe payments and simple returns</div>
            </div>
          </section>

          <section className="flex h-full items-start justify-center p-4 sm:p-5 md:items-center md:p-7">
            <div className="w-full max-w-sm">
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Welcome back</h1>
              <p className="mt-1 text-sm text-slate-600">Sign in and continue your shopping journey.</p>

              <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
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
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-800">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
                  />
                  <div className="mt-1.5 text-right">
                    <Link to="/forgot-password" className="text-xs font-semibold text-slate-700 hover:text-slate-900">
                      Forgot password?
                    </Link>
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {isSubmitting ? "Signing you in..." : "Sign In"}
                </button>
              </form>

              <p className="mt-3 text-sm text-slate-700">
                New here?{" "}
                <Link to="/signup" className="font-semibold text-gray-900 hover:text-black">
                  Create account
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
