import { create } from "zustand";
import { api } from "../api/axios";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  boot: () => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  boot: async () => {
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data.user, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      set({ user: null });
    }
  },
}));
