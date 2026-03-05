import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { AxiosError } from "axios";
import { forgotPasswordRequest } from "../service/authService";

const FORGOT_BG_URL =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2200&q=80";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await forgotPasswordRequest(email);
      setMessage(response.message || "If an account exists, a reset token has been sent.");
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to process request");
      } else {
        setError("Failed to process request");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${FORGOT_BG_URL})` }} />
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center p-3 sm:p-5">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/40 bg-[#f5f5f3]/95 p-5 shadow-2xl backdrop-blur-md sm:p-7">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Forgot Password</h1>
          <p className="mt-1 text-sm text-slate-600">
            Enter your account email. We will send you a reset token.
          </p>

          <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
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
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-emerald-700">{message}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-70"
            >
              {isSubmitting ? "Sending token..." : "Send Reset Token"}
            </button>
          </form>

          <div className="mt-4 text-sm text-slate-700">
            Remember password?{" "}
            <Link to="/login" className="font-semibold text-gray-900 hover:text-black">
              Back to Sign In
            </Link>
          </div>

          <div className="mt-2 text-sm text-slate-700">
            Have token already?{" "}
            <Link to="/reset-password" className="font-semibold text-gray-900 hover:text-black">
              Reset Password
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ForgotPasswordPage;
