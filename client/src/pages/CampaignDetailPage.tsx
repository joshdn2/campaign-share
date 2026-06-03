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

// Labels used for node type display.
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

// Node types shown as grids on the main campaign view.
const GRID_TYPES: NodeType[] = ["CHARACTER", "LOCATION", "ITEM", "CREATURE", "FACTION", "NOTE"];

/**
 * CampaignDetailPage – main view for a single campaign.
 * Shows info, members, arcs, and node grids.
 * Sidebar type filter switches to a dedicated list view.
 */
export function CampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterType = searchParams.get("type") as NodeType | null;
  const { user } = useAuthStore();

  // Data hooks
  const { data: campaign, isLoading: campaignLoading, error: campaignError } = useCampaign(campaignId!);
  const { data: nodes, isLoading: nodesLoading } = useCampaignNodes(campaignId!);

  // Mutations
  const updateCampaign = useUpdateCampaign(campaignId!);
  const addMember = useAddMember(campaignId!);
  const removeMember = useRemoveMember(campaignId!);
  const updateMemberRole = useUpdateMemberRole(campaignId!);
  const createNode = useCreateNode(campaignId!);

  // Modal state
  const [showAddMember, setShowAddMember] = useState(false);
  const [showCreateNode, setShowCreateNode] = useState(false);
  const [createNodeType, setCreateNodeType] = useState<NodeType | null>(null);
  const [pendingParentId, setPendingParentId] = useState<string | null>(null);

  // Auto-open create modal if ?create=1 is present in URL
  useEffect(() => {
    if (searchParams.get("create") === "1" && filterType) {
      setCreateNodeType(filterType);
      setShowCreateNode(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("create");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, filterType, setSearchParams]);

  const isDm = campaign?.dmId === user?.id;

  if (campaignLoading || nodesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (campaignError || !campaign) {
    return <ErrorMessage message={campaignError?.message || "Campaign not found"} />;
  }

  // Group nodes by type for the grid sections
  const nodesByType = nodes?.reduce(
    (acc, node) => {
      acc[node.type] = acc[node.type] || [];
      acc[node.type].push(node);
      return acc;
    },
    {} as Record<NodeType, typeof nodes>,
  );

  const filteredNodes = filterType ? nodes?.filter((n) => n.type === filterType) : null;
  const arcs = nodesByType?.ARC || [];
  const sessions = nodesByType?.SESSION || [];

  // Handlers
  const handleCreateNode = async (data: { title: string; excerpt: string }) => {
    if (!createNodeType) return;
    const node = await createNode.mutateAsync({
      type: createNodeType,
      title: data.title,
      excerpt: data.excerpt,
      parentId: pendingParentId || undefined,
    });
    setShowCreateNode(false);
    setCreateNodeType(null);
    setPendingParentId(null);
    navigate(`/campaigns/${campaignId}/nodes/${node.id}`);
  };

  const openCreateModal = (type: NodeType) => {
    setCreateNodeType(type);
    setShowCreateNode(true);
  };

  const openAddSession = (arcId: string) => {
    setCreateNodeType("SESSION");
    setPendingParentId(arcId);
    setShowCreateNode(true);
  };

  return (
    <div className="space-y-8">
      {/* Filtered list view (when sidebar type is clicked) */}
      {filterType && filteredNodes && (
        <FilteredNodeList
          campaignId={campaignId!}
          type={filterType}
          label={NODE_TYPE_LABELS[filterType]}
          nodes={filteredNodes}
          onCreate={() => openCreateModal(filterType)}
          onClear={() => setSearchParams({})}
        />
      )}

      {/* Full campaign view */}
      {!filterType && (
        <>
          <CampaignInfoSection
            campaign={campaign}
            isDm={isDm}
            onUpdate={(data) => updateCampaign.mutateAsync(data)}
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
              type={type}
              label={NODE_TYPE_LABELS[type]}
              nodes={nodesByType?.[type] || []}
            />
          ))}
        </>
      )}

      {/* Modals */}
      {showAddMember && (
        <AddMemberModal
          onAdd={(data) => addMember.mutateAsync(data)}
          onClose={() => setShowAddMember(false)}
          isPending={addMember.isPending}
        />
      )}

      {showCreateNode && createNodeType && (
        <CreateNodeModal
          type={createNodeType}
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
