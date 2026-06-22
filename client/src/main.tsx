/**
 * main.tsx
 *
 * Application bootstrap. Creates the React root, configures the
 * TanStack Query client, and wraps the app in the router and StrictMode.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./components/theme/ThemeProvider.tsx";

// Shared QueryClient used by all TanStack Query hooks in the app.
// Default options:
// - retry: 1           – failed queries retry once before surfacing an error.
// - refetchOnWindowFocus: false – keep data stable when the user tabs back.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Mount the app into the #root element. The non-null assertion assumes
// index.html contains <div id="root"></div>.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Provide the query client to the entire component tree */}
    <QueryClientProvider client={queryClient}>
      {/* Enable client-side routing */}
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
