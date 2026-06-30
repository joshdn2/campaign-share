/**
 * useUser.ts
 *
 * Hooks for the currently authenticated user's profile.
 */

import { useMutation } from "@tanstack/react-query";
import { api } from "../api/axios";
import { useAuthStore } from "../stores/authStore";
import type { User } from "../types";

/**
 * Updates the current user's profile.
 *
 * On success the Zustand auth store is updated so the new display name is
 * reflected immediately across the UI (e.g. the navbar).
 */
export function useUpdateUser() {
  return useMutation({
    mutationFn: async (data: { username: string }) => {
      const res = await api.patch<{ user: User }>("/auth/me", data);
      return res.data.user;
    },
    onSuccess: (user) => {
      useAuthStore.getState().setUser(user);
    },
  });
}
