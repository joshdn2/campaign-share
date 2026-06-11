import { useNavigate } from "react-router-dom";
import type { Campaign } from "../../types";

/**
 * ============================================================================
 * campaigns-list/CampaignCard.tsx
 * ============================================================================
 *
 * Renders a single campaign summary as a clickable card. Clicking the card
 * navigates to the campaign detail page. A "DM" badge is shown when the
 * current user owns the campaign.
 */

interface Props {
  campaign: Campaign;
}

/**
 * CampaignCard – clickable summary card for one campaign.
 *
 * Displays the campaign name, optional description, DM badge, and counts of
 * members and nodes. The whole card acts as a navigation button.
 */
export function CampaignCard({ campaign }: Props) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/campaigns/${campaign.id}`)}
      className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="mb-2 flex items-start justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{campaign.name}</h2>
        {campaign.dmId === campaign.dm?.id && (
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            DM
          </span>
        )}
      </div>
      {campaign.description && (
        <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
          {campaign.description}
        </p>
      )}
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span>{campaign._count?.members || 0} members</span>
        <span>{campaign._count?.nodes || 0} nodes</span>
      </div>
    </button>
  );
}
