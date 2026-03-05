import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { resetPasswordRequest } from "../service/authService";

const RESET_BG_URL =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2200&q=80";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { token: tokenFromUrl } = useParams();

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token.trim()) {
      setError("Reset token is required");
      return;
    }

    if (!newPassword.trim()) {
      setError("New password is required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await resetPasswordRequest(token.trim(), newPassword.trim());
      setMessage(response.message || "Password reset successful");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to reset password");
      } else {
        setError("Failed to reset password");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${RESET_BG_URL})` }} />
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center p-3 sm:p-5">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/40 bg-[#f5f5f3]/95 p-5 shadow-2xl backdrop-blur-md sm:p-7">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Reset Password</h1>
          <p className="mt-1 text-sm text-slate-600">
            Enter your reset token and set a new password.
          </p>

          <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="token" className="mb-1.5 block text-sm font-medium text-slate-800">
                Reset Token
              </label>
              <input
                id="token"
                type="text"
                placeholder="Paste token from your email"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
                required
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-slate-800">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-800">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isSubmitting ? "Resetting password..." : "Reset Password"}
            </button>
          </form>

          <div className="mt-4 text-sm text-slate-700">
            Back to sign in?{" "}
            <Link to="/login" className="font-semibold text-gray-900 hover:text-black">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ResetPasswordPage;
