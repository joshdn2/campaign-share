import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  useCampaign,
  useUpdateCampaign,
  useAddMember,
  useRemoveMember,
  useUpdateMemberRole,
} from "../hooks/useCampaigns";
import { useCampaignNodes, useCreateNode } from "../hooks/useNodes";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { useAuthStore } from "../stores/authStore";
import { CampaignInfoSection } from "./campaign-detail/CampaignInfoSection";
import { MembersSection } from "./campaign-detail/MembersSection";
import { NodeTypeGrid } from "./campaign-detail/NodeTypeGrid";
import { FilteredNodeList } from "./campaign-detail/FilteredNodeList";
import { AddMemberModal } from "./campaign-detail/AddMemberModal";
import { CreateNodeModal } from "./campaign-detail/CreateNodeModal";
import { CalendarCard } from "./campaign-detail/CalendarCard";
import { CalendarEditModal } from "./campaign-detail/CalendarEditModal";
import { useCalendar, useSaveCalendar } from "../hooks/useCalendars";
import type { CalendarDate, NodeType } from "../types";

/**
 * ============================================================================
 * CampaignDetailPage.tsx
 * ============================================================================
 *
 * Top-level route component for viewing a single campaign.
 * Route: /campaigns/:campaignId
 *
 * Responsibilities:
 *  - Fetch the campaign record and all its nodes.
 *  - Render the campaign info, member list, sessions, and node grids.
 *  - Support a filtered list view via the `?type=<NodeType>` query parameter,
 *    which is triggered when a node type is selected in the sidebar.
 *  - Manage modals for adding members and creating new nodes.
 *  - Read an optional `?create=1` query param to auto-open the node creation
 *    modal on first load (used by the sidebar "+" shortcuts).
 */

// Human-readable labels for each NodeType enum value.
const NODE_TYPE_LABELS: Record<NodeType, string> = {
  SESSION: "Session",
  CHARACTER: "Character",
  CREATURE: "Creature",
  ITEM: "Item",
  LOCATION: "Location",
  NOTE: "Note",
  FACTION: "Faction",
};

// Node types rendered as card grids on the main campaign detail page.
const GRID_TYPES: NodeType[] = [
  "SESSION",
  "CHARACTER",
  "LOCATION",
  "ITEM",
  "CREATURE",
  "FACTION",
  "NOTE",
];

/**
 * CampaignDetailPage – main view for a single campaign.
 *
 * Reads the `campaignId` route param and the `?type=<NodeType>` query param.
 * Shows info, members, sessions, and node grids. When `?type` is present, the
 * page switches to a dedicated list view for that node type instead of the full
 * campaign dashboard.
 */
export function CampaignDetailPage() {
  // --------------------------------------------------------------------------
  // Routing & URL state
  // --------------------------------------------------------------------------

  // `campaignId` comes from the route `/campaigns/:campaignId`.
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  // `searchParams` exposes the current query string; `setSearchParams` lets us
  // clear the type filter when the user clicks "Back".
  const [searchParams, setSearchParams] = useSearchParams();

  // `?type=CHARACTER` enables the filtered list view for that node type.
  // The value is cast to NodeType after null-checking elsewhere.
  const filterType = searchParams.get("type") as NodeType | null;

  // Current authenticated user, used to determine DM status.
  const { user } = useAuthStore();

  // --------------------------------------------------------------------------
  // Data fetching
  // --------------------------------------------------------------------------

  const {
    data: campaign,
    isLoading: campaignLoading,
    error: campaignError,
  } = useCampaign(campaignId!);

  const { data: nodes, isLoading: nodesLoading } = useCampaignNodes(
    campaignId!,
  );

  // --------------------------------------------------------------------------
  // Server-side mutations
  // --------------------------------------------------------------------------

  const updateCampaign = useUpdateCampaign(campaignId!);
  const addMember = useAddMember(campaignId!);
  const removeMember = useRemoveMember(campaignId!);
  const updateMemberRole = useUpdateMemberRole(campaignId!);
  const createNode = useCreateNode(campaignId!);

  // --------------------------------------------------------------------------
  // Local UI state
  // --------------------------------------------------------------------------

  // Controls visibility of the "Add Member" modal.
  const [showAddMember, setShowAddMember] = useState(false);

  // Controls visibility of the calendar edit modal.
  const [showCalendarEdit, setShowCalendarEdit] = useState(false);

  // Calendar data and save mutation for the edit modal.
  const { data: calendar } = useCalendar(campaignId!);
  const saveCalendar = useSaveCalendar(campaignId!);

  // Controls visibility of the "Create Node" modal and the type of node to create.
  // The initial state is read from `?create=1&type=<NodeType>` so the sidebar
  // "+" buttons can deep-link directly into creation.
  const [showCreateNode, setShowCreateNode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("create") === "1" && params.get("type") !== null;
  });

  const [createNodeType, setCreateNodeType] = useState<NodeType | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type") as NodeType | null;
    return params.get("create") === "1" && type ? type : null;
  });



  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------

  // The `?create=1` flag is only needed for the initial modal state. Remove it
  // from the URL once it has been consumed so the page state is clean and the
  // flag does not stick around on refresh.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "1") {
      params.delete("create");
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${params.toString()}`,
      );
    }
  }, []);

  // --------------------------------------------------------------------------
  // Derived data & guards
  // --------------------------------------------------------------------------

  // The current user is the DM when their id matches the campaign's dmId.
  const isDm = campaign?.dmId === user?.id;
  const isLoremaster =
    campaign?.members.some(
      (m) => m.userId === user?.id && m.role === "LOREMASTER",
    ) ?? false;

  // Show a loading spinner while either query is resolving.
  if (campaignLoading || nodesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If fetching failed or the campaign record is missing, surface an error.
  if (campaignError || !campaign) {
    return (
      <ErrorMessage message={campaignError?.message || "Campaign not found"} />
    );
  }

  // Group fetched nodes by their type so each NodeTypeGrid receives the right subset.
  const nodesByType = nodes?.reduce(
    (acc, node) => {
      acc[node.type] = acc[node.type] || [];
      acc[node.type].push(node);
      return acc;
    },
    {} as Record<NodeType, typeof nodes>,
  );

  // When `?type=...` is set, build the filtered list for that node type.
  const filteredNodes = filterType
    ? nodes?.filter((n) => n.type === filterType)
    : null;



  // --------------------------------------------------------------------------
  // Event handlers
  // --------------------------------------------------------------------------

  /**
   * Creates a new node using the currently selected node type and optional
   * pending parent id, then navigates to the newly created node's detail page.
   */
  const handleCreateNode = async (data: {
    title: string;
    excerpt: string;
    startDate?: CalendarDate;
    endDate?: CalendarDate;
  }) => {
    if (!createNodeType) return;

    const details: Record<string, unknown> = {};
    if (createNodeType === "SESSION") {
      details.startDateAgeId = data.startDate?.ageId ?? null;
      details.startDateYear = data.startDate?.year ?? null;
      details.startDateMonthId = data.startDate?.monthId ?? null;
      details.startDateDay = data.startDate?.day ?? null;
      details.endDateAgeId = data.endDate?.ageId ?? null;
      details.endDateYear = data.endDate?.year ?? null;
      details.endDateMonthId = data.endDate?.monthId ?? null;
      details.endDateDay = data.endDate?.day ?? null;
    }

    const node = await createNode.mutateAsync({
      type: createNodeType,
      title: data.title,
      excerpt: data.excerpt,
      details: Object.keys(details).length > 0 ? details : undefined,
    });

    // Close the modal and reset transient creation state.
    setShowCreateNode(false);
    setCreateNodeType(null);

    // Redirect into the new node's detail view.
    navigate(`/campaigns/${campaignId}/nodes/${node.id}`);
  };

  /** Opens the create-node modal for the selected node type. */
  const openCreateModal = (type: NodeType) => {
    setCreateNodeType(type);
    setShowCreateNode(true);
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Filtered list view (when the sidebar selected a node type via `?type`) */}
      {filterType && filteredNodes && (
        <FilteredNodeList
          campaignId={campaignId!}
          label={NODE_TYPE_LABELS[filterType]}
          nodes={filteredNodes}
          onCreate={() => openCreateModal(filterType)}
          onClear={() => setSearchParams({})}
        />
      )}

      {/* Full campaign dashboard view */}
      {!filterType && (
        <>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="lg:col-span-1">
              <CampaignInfoSection
                campaign={campaign}
                isDm={isDm}
                onUpdate={async (data) => {
                  await updateCampaign.mutateAsync(data);
                }}
                isUpdating={updateCampaign.isPending}
              />
            </div>

            <div className="lg:col-span-1">
              <MembersSection
                campaign={campaign}
                isDm={isDm}
                onAddMember={() => setShowAddMember(true)}
                onToggleRole={(userId, currentRole) =>
                  updateMemberRole.mutate({
                    userId,
                    role: currentRole === "PLAYER" ? "LOREMASTER" : "PLAYER",
                  })
                }
                onRemoveMember={(userId) => removeMember.mutate(userId)}
              />
            </div>
          </div>

          <CalendarCard
            campaignId={campaignId!}
            isDm={isDm}
            isLoremaster={isLoremaster}
            onEditCalendar={() => setShowCalendarEdit(true)}
          />

          {GRID_TYPES.map((type) => (
            <NodeTypeGrid
              key={type}
              campaignId={campaignId!}
              label={NODE_TYPE_LABELS[type]}
              nodes={nodesByType?.[type] || []}
            />
          ))}
        </>
      )}

      {/* Add Member modal */}
      {showAddMember && (
        <AddMemberModal
          onAdd={async (data) => {
            await addMember.mutateAsync(data);
          }}
          onClose={() => setShowAddMember(false)}
          isPending={addMember.isPending}
        />
      )}

      {/* Create Node modal */}
      {showCreateNode && createNodeType && (
        <CreateNodeModal
          label={NODE_TYPE_LABELS[createNodeType]}
          type={createNodeType}
          calendar={calendar ?? undefined}
          onCreate={handleCreateNode}
          onClose={() => {
            setShowCreateNode(false);
            setCreateNodeType(null);
          }}
          isPending={createNode.isPending}
        />
      )}

      {/* Calendar edit modal */}
      {showCalendarEdit && (
        <CalendarEditModal
          calendar={calendar ?? null}
          campaignId={campaignId!}
          onSave={async (data) => {
            await saveCalendar.mutateAsync(data);
          }}
          onClose={() => setShowCalendarEdit(false)}
          isPending={saveCalendar.isPending}
        />
      )}
    </div>
  );
}
