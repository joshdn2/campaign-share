import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMyCampaigns, useCreateCampaign } from "../hooks/useCampaigns";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { CampaignCard } from "./campaigns-list/CampaignCard";
import { CreateCampaignModal } from "./campaigns-list/CreateCampaignModal";

/**
 * CampaignsListPage – grid of all campaigns the user belongs to.
 * DM gets a badge. Click any card to enter the campaign.
 */
export function CampaignsListPage() {
  const navigate = useNavigate();
  const { data: campaigns, isLoading, error } = useMyCampaigns();
  const createCampaign = useCreateCampaign();

  const [showModal, setShowModal] = useState(false);

  const handleCreate = async (data: { name: string; description?: string }) => {
    const campaign = await createCampaign.mutateAsync(data);
    setShowModal(false);
    navigate(`/campaigns/${campaign.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error.message} />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Campaigns</h1>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Campaign
        </button>
      </div>

      {campaigns?.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            No campaigns yet. Create your first one to get started!
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns?.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>

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
