import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Let the auth store handle this via its own boot logic
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    return Promise.reject(error);
  },
);
