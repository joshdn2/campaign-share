/**
 * ProtectedRoute.tsx
 *
 * Route guard that prevents unauthenticated users from accessing the
 * main application shell. Shows a loading spinner while the session is
 * being restored.
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/**
 * Wraps children and only renders them for authenticated users.
 *
 * @param children - The protected content (e.g. the Layout route).
 *
 * Behavior:
 * - While session restoration is in progress, renders a full-screen spinner.
 * - If no user is logged in, redirects to /login with history replacement.
 * - Otherwise renders the children.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-subtle border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
