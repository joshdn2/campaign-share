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
import { ArcsSection } from "./campaign-detail/ArcsSection";
import { NodeTypeGrid } from "./campaign-detail/NodeTypeGrid";
import { FilteredNodeList } from "./campaign-detail/FilteredNodeList";
import { AddMemberModal } from "./campaign-detail/AddMemberModal";
import { CreateNodeModal } from "./campaign-detail/CreateNodeModal";
import type { NodeType } from "../types";

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
 *  - Render the campaign info, member list, arcs, and node grids.
 *  - Support a filtered list view via the `?type=<NodeType>` query parameter,
 *    which is triggered when a node type is selected in the sidebar.
 *  - Manage modals for adding members and creating new nodes.
 *  - Read an optional `?create=1` query param to auto-open the node creation
 *    modal on first load (used by the sidebar "+" shortcuts).
 */

// Human-readable labels for each NodeType enum value.
const NODE_TYPE_LABELS: Record<NodeType, string> = {
  ARC: "Arc",
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
 * Shows info, members, arcs, and node grids. When `?type` is present, the page
 * switches to a dedicated list view for that node type instead of the full
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

  // When creating a child node (e.g. a Session under an Arc), this stores the
  // parent id so the new node can be linked automatically.
  const [pendingParentId, setPendingParentId] = useState<string | null>(null);

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

  // Pull arcs and sessions out of the grouped nodes for the ArcsSection.
  const arcs = nodesByType?.ARC || [];
  const sessions = nodesByType?.SESSION || [];

  // --------------------------------------------------------------------------
  // Event handlers
  // --------------------------------------------------------------------------

  /**
   * Creates a new node using the currently selected node type and optional
   * pending parent id, then navigates to the newly created node's detail page.
   */
  const handleCreateNode = async (data: { title: string; excerpt: string }) => {
    if (!createNodeType) return;
    const node = await createNode.mutateAsync({
      type: createNodeType,
      title: data.title,
      excerpt: data.excerpt,
      parentId: pendingParentId || undefined,
    });

    // Close the modal and reset transient creation state.
    setShowCreateNode(false);
    setCreateNodeType(null);
    setPendingParentId(null);

    // Redirect into the new node's detail view.
    navigate(`/campaigns/${campaignId}/nodes/${node.id}`);
  };

  /** Opens the create-node modal for the selected node type. */
  const openCreateModal = (type: NodeType) => {
    setCreateNodeType(type);
    setShowCreateNode(true);
  };

  /**
   * Pre-configures the create-node modal to add a Session child under the
   * specified arc. Sets both the node type and the pending parent id.
   */
  const openAddSession = (arcId: string) => {
    setCreateNodeType("SESSION");
    setPendingParentId(arcId);
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
          <CampaignInfoSection
            campaign={campaign}
            isDm={isDm}
            onUpdate={async (data) => {
              await updateCampaign.mutateAsync(data);
            }}
            isUpdating={updateCampaign.isPending}
          />

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

          <ArcsSection
            campaignId={campaignId!}
            arcs={arcs}
            sessions={sessions}
            onAddSession={openAddSession}
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
          onCreate={handleCreateNode}
          onClose={() => {
            setShowCreateNode(false);
            setCreateNodeType(null);
            setPendingParentId(null);
          }}
          isPending={createNode.isPending}
        />
      )}
    </div>
  );
}
