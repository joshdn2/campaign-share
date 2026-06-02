import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";

export function useAuth() {
  const { user, isLoading, boot, logout } = useAuthStore();

  useEffect(() => {
    boot();
  }, [boot]);

  // Listen for global 401 events
  useEffect(() => {
    const handler = () => {
      useAuthStore.setState({ user: null, isLoading: false });
    };
    window.addEventListener("auth:unauthorized", handler);
    return () => window.removeEventListener("auth:unauthorized", handler);
  }, []);

  return { user, isLoading, logout };
}
