import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/axios";
import { isAxiosError } from "axios";
import { useAuthStore } from "../stores/authStore";

/**
 * ============================================================================
 * RegisterPage.tsx
 * ============================================================================
 *
 * Public route component for creating a new account.
 * Route: /register
 *
 * Responsibilities:
 *  - Collect display name, email, and password.
 *  - Register the user via `/auth/register`.
 *  - Immediately log the user in with the same credentials via `/auth/login`.
 *  - Fetch the current user from `/auth/me` and store it in auth state.
 *  - Redirect to `/campaigns` on success.
 *  - Display server validation or network error messages.
 */

/**
 * RegisterPage – renders the account-creation form.
 *
 * State:
 *  - displayName / email / password: controlled form inputs
 *  - error: inline error message string
 *  - loading: disables the submit button while the request is in flight
 */
export function RegisterPage() {
  const navigate = useNavigate();

  // Global auth store setter used to keep the UI in sync with the new user.
  const { setUser } = useAuthStore();

  // Form input state.
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Feedback state.
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Registers a new account and then signs the user in automatically.
   *
   * On success:
   *  1. The server creates the user and sets up the session cookie on login.
   *  2. We call `/auth/me` to retrieve the user profile.
   *  3. We update the auth store and redirect to the campaigns list.
   *
   * On failure we extract the most specific error message from the response.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register", { displayName, email, password });
      await api.post("/auth/login", { email, password });
      const me = await api.get("/auth/me");
      setUser(me.data.user);
      navigate("/campaigns");
    } catch (err) {
      if (isAxiosError(err)) {
        setError(
          err.response?.data?.error?.formErrors?.[0] ||
            err.response?.data?.error ||
            "Registration failed",
        );
      } else {
        setError("Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg dark:bg-gray-900">
        <h1 className="mb-6 text-2xl font-bold text-gray-800 dark:text-white">
          Create your account
        </h1>

        {/* Inline error alert */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Registration form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {/* Link to the login page */}
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
