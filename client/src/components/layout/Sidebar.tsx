/**
 * Sidebar.tsx
 *
 * Renders the left-hand navigation panel. When no campaign is selected
 * it lists the current user's campaigns. When a campaign id is present
 * it shows campaign-specific navigation: node type filters with counts
 * and a short list of recently updated nodes.
 *
 * Responsive behavior:
 *  - On desktop (`md:` and up) the sidebar is a static, always-visible panel
 *    on the left side of the layout.
 *  - On mobile it renders off-canvas and slides in when `isOpen` is true.
 *    A backdrop overlay lets the user dismiss it by tapping outside.
 *  - Any navigation action from inside the sidebar automatically closes the
 *    mobile drawer so the user isn't left staring at the menu after selecting
 *    an item.
 */

import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMyCampaigns } from "../../hooks/useCampaigns";
import { useCampaign } from "../../hooks/useCampaigns";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import type { NodeType } from "../../types";

interface SidebarProps {
  /** Whether the mobile slide-over sidebar is currently open. */
  isOpen?: boolean;
  /** Callback to close the mobile slide-over sidebar. */
  onClose?: () => void;
}

// Human-readable labels for each node type, used in the campaign nav.
const NODE_TYPE_LABELS: Record<NodeType, string> = {
  SESSION: "Sessions",
  CHARACTER: "Characters",
  CREATURE: "Creatures",
  ITEM: "Items",
  LOCATION: "Locations",
  NOTE: "Notes",
  FACTION: "Factions",
};

// Order in which node type filters are rendered.
const NODE_TYPE_ORDER: NodeType[] = [
  "SESSION",
  "CHARACTER",
  "CREATURE",
  "ITEM",
  "LOCATION",
  "FACTION",
  "NOTE",
];

// Shared aside classes. On desktop the sidebar is static and visible. On mobile
// it is fixed, full-height, and translated off-screen until `isOpen` is true.
const SIDEBAR_CLASSES =
  "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-default bg-accent-subtle p-4 transition-transform duration-200 ease-in-out md:static md:translate-x-0";

/**
 * Top-level sidebar router.
 *
 * Uses React Router's `useParams` to decide whether to render the
 * campaigns list or the navigation panel for a specific campaign.
 */
export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { campaignId } = useParams();

  // Wrap React Router's navigate so any in-sidebar navigation also closes the
  // mobile drawer. On desktop `onClose` is a no-op because the sidebar is
  // always visible.
  const navigateAndClose = (path: string) => {
    onClose?.();
    navigate(path);
  };

  // No campaign selected: show the user's campaigns list.
  if (!campaignId) {
    return (
      <CampaignsSidebar
        isOpen={isOpen}
        navigate={navigateAndClose}
      />
    );
  }

  // Campaign selected: show that campaign's node navigation.
  return (
    <CampaignNavSidebar
      campaignId={campaignId}
      isOpen={isOpen}
      navigate={navigateAndClose}
    />
  );
}

interface SidebarViewProps {
  /** Whether the mobile slide-over sidebar is currently open. */
  isOpen: boolean;
  /** Wrapped navigate function that also closes the mobile drawer. */
  navigate: (path: string) => void;
}

/**
 * Sidebar view shown on non-campaign routes (e.g. /campaigns).
 *
 * @param navigate - React Router's navigate function for routing.
 *
 * Fetches the user's campaigns with `useMyCampaigns` and renders each
 * campaign as a button. Campaigns where the current user is the DM are
 * badged with "DM".
 */
function CampaignsSidebar({ isOpen, navigate }: SidebarViewProps) {
  const { data: campaigns, isLoading } = useMyCampaigns();

  return (
    <>
      {/* Mobile backdrop: tap to close. Hidden on desktop. */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => navigate("/campaigns")}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${SIDEBAR_CLASSES} ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Campaigns sidebar"
      >
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted dark:text-secondary">
          My Campaigns
        </h2>

        {isLoading && <LoadingSpinner className="py-4" />}

        <div className="space-y-1">
          {campaigns?.map((campaign) => (
            <button
              key={campaign.id}
              onClick={() => navigate(`/campaigns/${campaign.id}`)}
              className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-primary hover:bg-surface dark:text-secondary dark:hover:bg-surface"
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{campaign.name}</span>
                {/* Badge the campaign if the current user is its DM */}
                {campaign.dmId === campaign.dm?.id && (
                  <span className="ml-2 text-[10px] rounded bg-accent-subtle px-1.5 py-0.5 text-accent dark:bg-accent-subtle dark:text-accent">
                    DM
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Empty state when the user has no campaigns */}
        {campaigns?.length === 0 && (
          <p className="py-4 text-center text-sm text-muted dark:text-secondary">
            No campaigns yet
          </p>
        )}
      </aside>
    </>
  );
}

interface CampaignNavSidebarProps extends SidebarViewProps {
  campaignId: string;
}

/**
 * Sidebar view shown when viewing a specific campaign.
 *
 * @param campaignId - The id of the campaign being viewed.
 * @param navigate   - React Router's navigate function for routing.
 *
 * Reads the active node type filter from the URL search params
 * (`?type=CHARACTER`) and the campaign details from TanStack Query.
 * Provides:
 * - A link back to the campaign overview.
 * - Filter buttons for each node type with counts and quick-create actions.
 * - A list of the most recent nodes.
 */
function CampaignNavSidebar({
  campaignId,
  isOpen,
  navigate,
}: CampaignNavSidebarProps) {
  const [searchParams] = useSearchParams();
  const activeType = searchParams.get("type") || "";
  const { data: campaign, isLoading } = useCampaign(campaignId);

  if (isLoading) {
    return (
      <>
        {isOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => navigate(`/campaigns/${campaignId}`)}
            aria-hidden="true"
          />
        )}
        <aside
          className={`${SIDEBAR_CLASSES} ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-label="Campaign navigation sidebar"
        >
          <LoadingSpinner className="py-4" />
        </aside>
      </>
    );
  }

  // If the campaign query returned nothing, render nothing.
  if (!campaign) return null;

  // Count nodes per type so each filter can show a badge.
  const nodesByType = campaign.nodes?.reduce(
    (acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <>
      {/* Mobile backdrop: tap to close. Hidden on desktop. */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => navigate(`/campaigns/${campaignId}`)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${SIDEBAR_CLASSES} ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Campaign navigation sidebar"
      >
        {/* <button
          onClick={() => navigate("/campaigns")}
          className="mb-4 flex items-center gap-1 text-sm text-muted hover:text-primary dark:text-secondary dark:hover:text-secondary"
        >
          ← All Campaigns
        </button> */}

        {/* Campaign title links back to the campaign overview */}
        <button
          onClick={() => navigate(`/campaigns/${campaignId}`)}
          className="mb-1 text-left text-sm font-bold text-primary hover:text-accent dark:text-primary dark:hover:text-accent"
        >
          {campaign.name}
        </button>

        {/* Node type filters */}
        <div className="mb-4 space-y-1">
          {NODE_TYPE_ORDER.map((type) => {
            const count = nodesByType?.[type] || 0;
            const isActive = activeType === type;

            return (
              <div
                key={type}
                className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-item-bg text-accent ring-1 ring-accent dark:bg-item-bg dark:text-accent dark:ring-accent"
                    : "text-muted hover:bg-surface dark:text-secondary dark:hover:bg-surface"
                }`}
              >
                {/* Filter button: navigate to campaign with type query param */}
                <button
                  onClick={() =>
                    navigate(`/campaigns/${campaignId}?type=${type}`)
                  }
                  className="flex flex-1 items-center justify-between text-left"
                >
                  <span>{NODE_TYPE_LABELS[type]}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      isActive
                        ? "bg-surface text-accent dark:bg-surface dark:text-accent"
                        : "bg-surface text-muted dark:bg-surface dark:text-secondary"
                    }`}
                  >
                    {count}
                  </span>
                </button>

                {/* Quick-create button opens the creation modal by setting create=1 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(
                      `/campaigns/${campaignId}?type=${type}&create=1`,
                    );
                  }}
                  className="ml-1 rounded p-0.5 text-accent hover:bg-accent-subtle dark:text-accent dark:hover:bg-accent-subtle"
                  title={`Create ${NODE_TYPE_LABELS[type]}`}
                >
                  +
                </button>
              </div>
            );
          })}
        </div>

        {/* Recently updated nodes for quick access */}
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted dark:text-secondary">
          Recent Nodes
        </h3>
        <div className="space-y-1">
          {campaign.nodes?.slice(0, 8).map((node) => (
            <button
              key={node.id}
              onClick={() =>
                navigate(`/campaigns/${campaignId}/nodes/${node.id}`)
              }
              className="w-full truncate rounded-md px-3 py-1.5 text-left text-sm text-muted hover:bg-surface dark:text-secondary dark:hover:bg-surface"
            >
              <span className="mr-1 text-xs text-secondary">
                {node.type.slice(0, 3)}
              </span>
              {node.title}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}
