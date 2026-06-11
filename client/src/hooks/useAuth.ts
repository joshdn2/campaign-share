/**
 * useAuth.ts
 *
 * React hook that bridges the Zustand auth store with the component tree.
 * It restores the session on mount and listens for global 401 events so
 * the UI can react as soon as the cookie-based session expires.
 */

import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";

/**
 * Auth hook for components.
 *
 * @returns The current user, loading state, and a logout action.
 *
 * On mount it calls `boot()` from the auth store, which pings `/auth/me`
 * to see if a valid session cookie exists. A second effect listens for the
 * `auth:unauthorized` event dispatched by the axios response interceptor
 * whenever an API call returns HTTP 401, immediately clearing the user.
 */
export function useAuth() {
  const { user, isLoading, boot, logout } = useAuthStore();

  // Restore session on first render.
  useEffect(() => {
    boot();
  }, [boot]);

  // Listen for global 401 events
  useEffect(() => {
    const handler = () => {
      // Reset auth state so the UI switches to logged-out.
      useAuthStore.setState({ user: null, isLoading: false });
    };
    window.addEventListener("auth:unauthorized", handler);
    return () => window.removeEventListener("auth:unauthorized", handler);
  }, []);

  return { user, isLoading, logout };
}
