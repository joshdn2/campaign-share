import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useNode,
  useUpdateNode,
  useDeleteNode,
  useCampaignNodes,
} from "../hooks/useNodes";
import {
  useNodeBlocks,
  useCreateBlock,
  useUpdateBlock,
  useDeleteBlock,
} from "../hooks/useBlocks";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { useAuthStore } from "../stores/authStore";
import type { Node, NodeType } from "../types";

// Sub-components
import { NodeHeader } from "./node-detail/NodeHeader";
import { ArcDetails } from "./node-detail/sections/ArcDetails";
import { SessionDetails } from "./node-detail/sections/SessionDetails";
import { CharacterDetails } from "./node-detail/sections/CharacterDetails";
import { CreatureDetails } from "./node-detail/sections/CreatureDetails";
import { ItemDetails } from "./node-detail/sections/ItemDetails";
import { LocationDetails } from "./node-detail/sections/LocationDetails";
import { FactionDetails } from "./node-detail/sections/FactionDetails";
import { LinksSection } from "./node-detail/LinksSection";
import { TagsSection } from "./node-detail/TagsSection";
import { BlocksSection } from "./node-detail/BlocksSection";
import { AddBlockModal } from "./node-detail/AddBlockModal";
import { ParentSelector } from "./node-detail/ParentSelector";

// Maps each node type to its detail section component.
const DETAIL_COMPONENTS: Record<NodeType, React.FC<{ node: Node }>> = {
  ARC: ArcDetails,
  SESSION: SessionDetails,
  CHARACTER: CharacterDetails,
  CREATURE: CreatureDetails,
  ITEM: ItemDetails,
  LOCATION: LocationDetails,
  NOTE: () => null,
  FACTION: FactionDetails,
};

/**
 * NodeDetailPage – full view for any node type.
 * Shows header, type-specific details, links, tags, blocks, and parent selector.
 */
export function NodeDetailPage() {
  const { campaignId, nodeId } = useParams<{
    campaignId: string;
    nodeId: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Data
  const { data: node, isLoading, error } = useNode(nodeId!);
  const { data: campaignNodes } = useCampaignNodes(campaignId!);
  const { data: blocks } = useNodeBlocks(nodeId!);

  // Mutations
  const updateNode = useUpdateNode(nodeId!);
  const deleteNode = useDeleteNode();
  const createBlock = useCreateBlock(nodeId!);
  const updateBlock = useUpdateBlock(nodeId!);
  const deleteBlock = useDeleteBlock(nodeId!);

  // UI state
  const [showAddBlock, setShowAddBlock] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !node) {
    return <ErrorMessage message={error?.message || "Node not found"} />;
  }

  const isOwner = node.ownerId === user?.id;
  const isDm = node.campaign?.dmId === user?.id;
  const canEdit = isOwner || isDm;

  const DetailComponent = DETAIL_COMPONENTS[node.type];

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this node?")) return;
    await deleteNode.mutateAsync({ nodeId: node.id, campaignId: campaignId! });
    navigate(`/campaigns/${campaignId}`);
  };

  return (
    <div className="space-y-6">
      {/* Title + badges */}
      <NodeHeader
        node={node}
        canEdit={canEdit}
        canDelete={canEdit}
        onUpdateTitle={async (title) => {
          await updateNode.mutateAsync({ title });
        }}
        onDelete={handleDelete}
        isUpdating={updateNode.isPending}
      />

      {/* Type-specific details */}
      {DetailComponent && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white">
            Details
          </h2>
          <DetailComponent node={node} />
        </section>
      )}

      {/* Parent selector */}
      {canEdit && campaignNodes && (
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Parent
          </h3>
          <ParentSelector
            node={node}
            campaignNodes={campaignNodes}
            onChange={(parentId) => updateNode.mutate({ parentId })}
          />
        </section>
      )}

      {/* Parent / Children read-only links */}
      {node.parent && (
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Parent:{" "}
            <button
              onClick={() =>
                navigate(`/campaigns/${campaignId}/nodes/${node.parent!.id}`)
              }
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              {node.parent.title}
            </button>
          </p>
        </section>
      )}
      {node.children && node.children.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Children
          </h3>
          <div className="flex flex-wrap gap-2">
            {node.children.map((child) => (
              <button
                key={child.id}
                onClick={() =>
                  navigate(`/campaigns/${campaignId}/nodes/${child.id}`)
                }
                className="rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {child.title}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Links */}
      <LinksSection node={node} campaignId={campaignId!} />

      {/* Tags */}
      <TagsSection tags={node.tags} />

      {/* Blocks */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Blocks
          </h2>
          <button
            onClick={() => setShowAddBlock(true)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Add Block
          </button>
        </div>
        <BlocksSection
          blocks={blocks || []}
          canEdit={canEdit}
          currentUserId={user?.id || ""}
          isDm={isDm}
          onEdit={async (blockId, content, visibility) => {
            await updateBlock.mutateAsync({ blockId, data: { content, visibility } });
          }}
          onDelete={(blockId) => {
            if (confirm("Delete this block?")) deleteBlock.mutate(blockId);
          }}
        />
      </section>

      {/* Add Block Modal */}
      {showAddBlock && (
        <AddBlockModal
          onAdd={async (data) => {
            await createBlock.mutateAsync(data);
          }}
          onClose={() => setShowAddBlock(false)}
          isPending={createBlock.isPending}
        />
      )}
    </div>
  );
}
