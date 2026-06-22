import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMyCampaigns, useCreateCampaign } from "../hooks/useCampaigns";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { CampaignCard } from "./campaigns-list/CampaignCard";
import { CreateCampaignModal } from "./campaigns-list/CreateCampaignModal";

/**
 * ============================================================================
 * CampaignsListPage.tsx
 * ============================================================================
 *
 * Top-level route component for the authenticated home screen.
 * Route: /campaigns
 *
 * Responsibilities:
 *  - Fetch and display all campaigns the current user belongs to.
 *  - Provide a "New Campaign" button that opens a creation modal.
 *  - Navigate into a campaign when its card is clicked.
 */

/**
 * CampaignsListPage – grid of all campaigns the user belongs to.
 *
 * Each campaign is rendered as a card (DM badge included). Clicking a card
 * navigates to that campaign's detail page.
 */
export function CampaignsListPage() {
  const navigate = useNavigate();

  // Query hook that returns campaigns where the current user is a member or DM.
  const { data: campaigns, isLoading, error } = useMyCampaigns();

  // Mutation hook for creating a new campaign.
  const createCampaign = useCreateCampaign();

  // Local state controlling the create-campaign modal visibility.
  const [showModal, setShowModal] = useState(false);

  /**
   * Creates a campaign from the modal form, then navigates into it on success.
   */
  const handleCreate = async (data: { name: string; description?: string }) => {
    const campaign = await createCampaign.mutateAsync(data);
    setShowModal(false);
    navigate(`/campaigns/${campaign.id}`);
  };

  // Loading state: wait for the campaigns query to resolve.
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state: show the query error if fetching failed.
  if (error) {
    return <ErrorMessage message={error.message} />;
  }

  return (
    <div>
      {/* Header with the new-campaign trigger */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">My Campaigns</h1>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-text-on-accent hover:bg-accent-hover"
        >
          + New Campaign
        </button>
      </div>

      {/* Empty state for users who have not joined any campaigns yet */}
      {campaigns?.length === 0 && (
        <div className="rounded-xl border border-dashed border-default bg-card-bg p-12 text-center dark:border-default">
          <p className="text-muted dark:text-secondary">
            No campaigns yet. Create your first one to get started!
          </p>
        </div>
      )}

      {/* Responsive grid of campaign cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns?.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>

      {/* Create-campaign modal rendered conditionally */}
      {showModal && (
        <CreateCampaignModal
          onCreate={handleCreate}
          onClose={() => setShowModal(false)}
          isPending={createCampaign.isPending}
        />
      )}
    </div>
  );
}
