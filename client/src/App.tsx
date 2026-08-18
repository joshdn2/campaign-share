/**
 * App.tsx
 *
 * Root routing configuration for the Campaign Notes React SPA.
 * Defines the public landing and authentication routes, and wraps the
 * main application shell in a ProtectedRoute guard so only authenticated
 * users can access campaign-related pages.
 */

import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/ui/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { CampaignsListPage } from "./pages/CampaignsListPage";
import { CampaignDetailPage } from "./pages/CampaignDetailPage";
import { NodeDetailPage } from "./pages/NodeDetailPage";
import { SearchResultsPage } from "./pages/SearchResultsPage";
import { AccountPage } from "./pages/AccountPage";

/**
 * Renders the application's route tree.
 *
 * Public routes:
 * - /          – landing page (redirects logged-in users to /campaigns)
 * - /login     – login form
 * - /register  – registration form
 *
 * Protected routes (wrapped in ProtectedRoute + Layout):
 * - /campaigns         – list of the current user's campaigns
 * - /campaigns/:campaignId          – campaign overview
 * - /campaigns/:campaignId/nodes/:nodeId – node detail view
 */
export default function App() {
  return (
    <Routes>
      {/* Public landing and authentication routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Everything below requires an active session */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/campaigns" element={<CampaignsListPage />} />
        <Route path="/campaigns/:campaignId" element={<CampaignDetailPage />} />
        <Route path="/campaigns/:campaignId/search" element={<SearchResultsPage />} />
        <Route path="/campaigns/:campaignId/nodes/:nodeId" element={<NodeDetailPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/account" element={<AccountPage />} />
      </Route>
    </Routes>
  );
}
