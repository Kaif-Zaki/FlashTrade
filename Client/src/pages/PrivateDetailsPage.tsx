import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  changePasswordRequest,
  getProfileRequest,
  type AuthUser,
} from "../service/authService.ts";
import { useAuth } from "../context/useAuth.ts";

const PrivateDetailsPage = () => {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setProfile(null);
      setError("");
      setIsLoading(true);
      try {
        const data = await getProfileRequest();
        setProfile(data);
      } catch (err) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || "Failed to load profile");
        } else {
          setError("Failed to load profile");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();

    const onAuthUpdated = () => {
      loadProfile();
    };
    window.addEventListener("auth-updated", onAuthUpdated);
    return () => {
      window.removeEventListener("auth-updated", onAuthUpdated);
    };
  }, []);

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changePasswordRequest({ currentPassword, newPassword });
      setPasswordMessage(result.message || "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof AxiosError) {
        setPasswordError(err.response?.data?.message || "Failed to change password");
      } else {
        setPasswordError("Failed to change password");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Private Details</h1>
        <button
          type="button"
          onClick={async () => {
            setIsLoggingOut(true);
            await logout();
          }}
          disabled={isLoggingOut}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
      {isLoading && <p className="mt-3 text-gray-600">Loading profile...</p>}
      {!isLoading && error && <p className="mt-3 text-red-600">{error}</p>}
      {!isLoading && profile && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
            <p>
              <span className="font-semibold">Name:</span> {profile.name}
            </p>
            <p>
              <span className="font-semibold">Email:</span> {profile.email}
            </p>
            <p>
              <span className="font-semibold">Address:</span>{" "}
              {profile.address || "Not provided"}
            </p>
            <p className="text-sm text-gray-500">User ID: {profile._id}</p>
          </div>

          <form
            onSubmit={handleChangePassword}
            className="rounded-xl border bg-white p-5 shadow-sm space-y-4"
          >
            <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>

            <div>
              <label className="mb-1 block text-sm text-gray-600">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-600">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-600">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
              />
            </div>

            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
            {passwordMessage && <p className="text-sm text-green-700">{passwordMessage}</p>}

            <button
              type="submit"
              disabled={isChangingPassword}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-70"
            >
              {isChangingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PrivateDetailsPage;
