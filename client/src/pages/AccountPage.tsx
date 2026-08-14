/**
 * AccountPage.tsx
 *
 * User account management page. Lets the user update their username and
 * configure display preferences. Subscription management is stubbed out for
 * future integration.
 */

import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useUpdateUser } from "../hooks/useUser";
import { ThemeControls } from "../components/theme/ThemeControls";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import type { User } from "../types";

export function AccountPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <ErrorMessage message="Not authenticated" />;
  }

  return <AccountForm user={user} />;
}

interface AccountFormProps {
  user: User;
}

function AccountForm({ user }: AccountFormProps) {
  const updateUser = useUpdateUser();

  // Initialize directly from the loaded user to avoid syncing state in an
  // effect, which can cause cascading renders.
  const [username, setUsername] = useState(user.username);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const trimmed = username.trim();
    if (!trimmed || trimmed === user.username) return;

    try {
      await updateUser.mutateAsync({ username: trimmed });
      setMessage("Username updated.");
    } catch (err) {
      setMessage("Failed to update username. Please try again.");
      console.log(err);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-primary dark:text-primary">
        Account
      </h1>

      {/* Profile / username */}
      <section className="rounded-xl border border-transparent bg-card-bg p-4 md:p-6">
        <h2 className="mb-4 text-lg font-semibold text-primary dark:text-primary">
          Profile
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-primary dark:text-secondary">
              Email
            </label>
            <p className="text-sm text-muted dark:text-secondary">
              {user.email}
            </p>
          </div>

          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-sm font-medium text-primary dark:text-secondary"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={30}
              pattern="^(?:[a-zA-Z0-9_]|-)+$"
              title="Username can only contain letters, numbers, underscores, and hyphens"
              className="w-full rounded-lg border border-default px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-default dark:bg-surface dark:text-primary"
            />
          </div>

          {message && (
            <p
              className={`text-sm ${
                updateUser.isError ? "text-danger" : "text-success"
              }`}
            >
              {message}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={
                updateUser.isPending || username.trim() === user.username
              }
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-text-on-accent hover:bg-accent-hover disabled:opacity-50"
            >
              {updateUser.isPending ? "Saving..." : "Save Username"}
            </button>
          </div>
        </form>
      </section>

      {/* Display preferences */}
      <section className="rounded-xl border border-transparent bg-card-bg p-4 md:p-6">
        <h2 className="mb-4 text-lg font-semibold text-primary dark:text-primary">
          Display
        </h2>
        <ThemeControls />
      </section>

      {/* Subscription */}
      <section className="rounded-xl border border-transparent bg-card-bg p-4 md:p-6">
        <h2 className="mb-2 text-lg font-semibold text-primary dark:text-primary">
          Subscription
        </h2>
        <p className="text-sm text-muted dark:text-secondary">
          Subscription management is not set up yet.
        </p>
      </section>
    </div>
  );
}
