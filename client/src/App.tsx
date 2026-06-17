/**
 * App.tsx
 *
 * Root routing configuration for the CampaignHub React SPA.
 * Defines public authentication routes and wraps the main application
 * shell in a ProtectedRoute guard so only authenticated users can
 * access campaign-related pages.
 */

import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/ui/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { CampaignsListPage } from "./pages/CampaignsListPage";
import { CampaignDetailPage } from "./pages/CampaignDetailPage";
import { NodeDetailPage } from "./pages/NodeDetailPage";
import { SearchResultsPage } from "./pages/SearchResultsPage";

/**
 * Renders the application's route tree.
 *
 * Public routes:
 * - /login     – login form
 * - /register  – registration form
 *
 * Protected routes (wrapped in ProtectedRoute + Layout):
 * - /                  – redirects to /campaigns
 * - /campaigns         – list of the current user's campaigns
 * - /campaigns/:campaignId          – campaign overview
 * - /campaigns/:campaignId/nodes/:nodeId – node detail view
 */
export default function App() {
  return (
    <Routes>
      {/* Public authentication routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Everything under "/" requires an active session */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Default landing redirects to the campaigns list */}
        <Route index element={<Navigate to="/campaigns" replace />} />
        <Route path="campaigns" element={<CampaignsListPage />} />
        <Route path="campaigns/:campaignId" element={<CampaignDetailPage />} />
        <Route path="campaigns/:campaignId/search" element={<SearchResultsPage />} />
        <Route path="campaigns/:campaignId/nodes/:nodeId" element={<NodeDetailPage />} />
        <Route path="search" element={<SearchResultsPage />} />
      </Route>
    </Routes>
  );
}
