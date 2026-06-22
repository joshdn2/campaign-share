import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/axios";
import { isAxiosError } from "axios";
import { useAuthStore } from "../stores/authStore";

/**
 * ============================================================================
 * LoginPage.tsx
 * ============================================================================
 *
 * Public route component for signing in.
 * Route: /login
 *
 * Responsibilities:
 *  - Collect email and password from the user.
 *  - POST credentials to `/auth/login`.
 *  - Fetch the current user from `/auth/me` on success and store it in auth state.
 *  - Redirect to `/campaigns` after a successful login.
 *  - Display server or network error messages.
 */

/**
 * LoginPage – renders the sign-in form.
 *
 * State:
 *  - email / password: controlled form inputs
 *  - error: inline error message string
 *  - loading: disables the submit button while the request is in flight
 */
export function LoginPage() {
  const navigate = useNavigate();

  // Global auth store setter used to keep the UI in sync with the logged-in user.
  const { setUser } = useAuthStore();

  // Form input state.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Feedback state.
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Submits the login credentials to the backend.
   *
   * On success:
   *  1. The server sets an HTTP-only session cookie via the login response.
   *  2. We call `/auth/me` to retrieve the user profile.
   *  3. We update the auth store and redirect to the campaigns list.
   *
   * On failure we extract the most specific error message available from the
   * Axios response and display it inline.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/login", { email, password });
      const me = await api.get("/auth/me");
      setUser(me.data.user);
      navigate("/campaigns");
    } catch (err) {
      if (isAxiosError(err)) {
        setError(
          err.response?.data?.error?.formErrors?.[0] ||
            err.response?.data?.error ||
            "Login failed",
        );
      } else {
        setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 dark:bg-base">
      <div className="w-full max-w-md rounded-xl bg-card-bg p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-primary">
          Sign in to CampaignHub
        </h1>

        {/* Inline error alert */}
        {error && (
          <div className="mb-4 rounded-lg bg-danger-subtle p-3 text-sm text-danger dark:bg-danger-subtle dark:text-danger">
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-primary dark:text-secondary">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-default px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-default dark:bg-surface dark:text-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-primary dark:text-secondary">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-default px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-default dark:bg-surface dark:text-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-text-on-accent hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Link to the registration page */}
        <p className="mt-4 text-center text-sm text-muted dark:text-secondary">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-accent hover:underline dark:text-accent"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
