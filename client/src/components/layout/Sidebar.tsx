import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMyCampaigns } from "../../hooks/useCampaigns";
import { useCampaign } from "../../hooks/useCampaigns";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import type { NodeType } from "../../types";

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  ARC: "Arcs",
  SESSION: "Sessions",
  CHARACTER: "Characters",
  CREATURE: "Creatures",
  ITEM: "Items",
  LOCATION: "Locations",
  NOTE: "Notes",
  FACTION: "Factions",
};

const NODE_TYPE_ORDER: NodeType[] = [
  "ARC",
  "SESSION",
  "CHARACTER",
  "CREATURE",
  "ITEM",
  "LOCATION",
  "FACTION",
  "NOTE",
];

export function Sidebar() {
  const navigate = useNavigate();
  const { campaignId } = useParams();

  if (!campaignId) {
    return <CampaignsSidebar navigate={navigate} />;
  }

  return <CampaignNavSidebar campaignId={campaignId} navigate={navigate} />;
}

function CampaignsSidebar({ navigate }: { navigate: (path: string) => void }) {
  const { data: campaigns, isLoading } = useMyCampaigns();

  return (
    <aside className="w-64 border-r border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        My Campaigns
      </h2>

      {isLoading && <LoadingSpinner className="py-4" />}

      <div className="space-y-1">
        {campaigns?.map((campaign) => (
          <button
            key={campaign.id}
            onClick={() => navigate(`/campaigns/${campaign.id}`)}
            className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <div className="flex items-center justify-between">
              <span className="truncate">{campaign.name}</span>
              {campaign.dmId === campaign.dm?.id && (
                <span className="ml-2 text-[10px] rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  DM
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {campaigns?.length === 0 && (
        <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          No campaigns yet
        </p>
      )}
    </aside>
  );
}

function CampaignNavSidebar({
  campaignId,
  navigate,
}: {
  campaignId: string;
  navigate: (path: string) => void;
}) {
  const [searchParams] = useSearchParams();
  const activeType = searchParams.get("type") || "";
  const { data: campaign, isLoading } = useCampaign(campaignId);

  if (isLoading) {
    return (
      <aside className="w-64 border-r border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
        <LoadingSpinner className="py-4" />
      </aside>
    );
  }

  if (!campaign) return null;

  const nodesByType = campaign.nodes?.reduce(
    (acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <aside className="w-64 border-r border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
      {/* <button
        onClick={() => navigate("/campaigns")}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        ← All Campaigns
      </button> */}

      <button
        onClick={() => navigate(`/campaigns/${campaignId}`)}
        className="mb-1 text-left text-sm font-bold text-gray-800 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
      >
        {campaign.name}
      </button>

      <div className="mb-4 space-y-1">
        {NODE_TYPE_ORDER.map((type) => {
          const count = nodesByType?.[type] || 0;
          const isActive = activeType === type;
          return (
            <div
              key={type}
              className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors ${
                isActive
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
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
                      ? "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                      : "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {count}
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/campaigns/${campaignId}?type=${type}&create=1`);
                }}
                className="ml-1 rounded p-0.5 text-gray-400 hover:bg-gray-300 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                title={`Create ${NODE_TYPE_LABELS[type]}`}
              >
                +
              </button>
            </div>
          );
        })}
      </div>

      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Recent Nodes
      </h3>
      <div className="space-y-1">
        {campaign.nodes?.slice(0, 8).map((node) => (
          <button
            key={node.id}
            onClick={() =>
              navigate(`/campaigns/${campaignId}/nodes/${node.id}`)
            }
            className="w-full truncate rounded-md px-3 py-1.5 text-left text-sm text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <span className="mr-1 text-xs text-gray-400">
              {node.type.slice(0, 3)}
            </span>
            {node.title}
          </button>
        ))}
      </div>
    </aside>
  );
}
