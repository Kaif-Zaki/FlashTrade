import loginPic from '../assets/LoginPic.jpg'
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.ts";
import { loginRequest } from "../service/authService.ts";
import { AxiosError } from "axios";

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await loginRequest({ email, password });
      login(response.accessToken);
      navigate("/UserDashboard");
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
    <main className="min-h-screen bg-slate-100 p-3 sm:p-4 lg:p-6">
      <div className="mx-auto grid h-full w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl lg:grid-cols-2">
        <section className="relative hidden h-full lg:block">
          <img src={loginPic} alt="Login side image" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/20" />
        </section>

        <section className="flex h-full items-start justify-center overflow-y-auto p-5 sm:p-6 lg:items-center lg:p-8">
          <div className="w-full max-w-md py-2">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-700">Login to continue.</p>

            <form className="mt-5 space-y-3.5" onSubmit={handleSubmit}>
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
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-200"
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
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-200"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="mt-4 text-sm text-slate-700">
              New here?{" "}
              <Link to="/signup" className="font-semibold text-sky-700 hover:text-sky-800">
                Create account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
