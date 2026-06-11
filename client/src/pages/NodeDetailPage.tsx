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

/**
 * ============================================================================
 * NodeDetailPage.tsx
 * ============================================================================
 *
 * Top-level route component for viewing any type of node.
 * Route: /campaigns/:campaignId/nodes/:nodeId
 *
 * Responsibilities:
 *  - Load the requested node and its blocks.
 *  - Render the node header, type-specific details, links, tags, and blocks.
 *  - Allow editing/deleting the node title when the user owns the node or is DM.
 *  - Allow changing the node's parent within the campaign hierarchy.
 *  - Support adding new blocks through a modal.
 */

/**
 * Maps each NodeType to its dedicated detail-section component.
 * NOTE nodes have no extra detail fields, so they render nothing here.
 */
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
 *
 * Reads `campaignId` and `nodeId` from the URL. Shows the node header,
 * type-specific details, parent/children links, related node links, tags, and
 * editable blocks.
 */
export function NodeDetailPage() {
  // --------------------------------------------------------------------------
  // Routing
  // --------------------------------------------------------------------------

  const { campaignId, nodeId } = useParams<{
    campaignId: string;
    nodeId: string;
  }>();
  const navigate = useNavigate();

  // --------------------------------------------------------------------------
  // Auth & permissions
  // --------------------------------------------------------------------------

  const { user } = useAuthStore();

  // --------------------------------------------------------------------------
  // Data fetching
  // --------------------------------------------------------------------------

  const { data: node, isLoading, error } = useNode(nodeId!);

  // All campaign nodes are fetched so the parent selector can list candidates.
  const { data: campaignNodes } = useCampaignNodes(campaignId!);

  // Blocks are the free-form content attached to this node.
  const { data: blocks } = useNodeBlocks(nodeId!);

  // --------------------------------------------------------------------------
  // Mutations
  // --------------------------------------------------------------------------

  const updateNode = useUpdateNode(nodeId!);
  const deleteNode = useDeleteNode();
  const createBlock = useCreateBlock(nodeId!);
  const updateBlock = useUpdateBlock(nodeId!);
  const deleteBlock = useDeleteBlock(nodeId!);

  // --------------------------------------------------------------------------
  // Local UI state
  // --------------------------------------------------------------------------

  const [showAddBlock, setShowAddBlock] = useState(false);

  // --------------------------------------------------------------------------
  // Guards
  // --------------------------------------------------------------------------

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

  // Permission checks: the creator of the node and the campaign DM can edit.
  const isOwner = node.ownerId === user?.id;
  const isDm = node.campaign?.dmId === user?.id;
  const canEdit = isOwner || isDm;

  // Pick the detail section component based on the node's type.
  const DetailComponent = DETAIL_COMPONENTS[node.type];

  /**
   * Confirms and then deletes the current node. On success, redirects back to
   * the parent campaign detail page.
   */
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this node?")) return;
    await deleteNode.mutateAsync({ nodeId: node.id, campaignId: campaignId! });
    navigate(`/campaigns/${campaignId}`);
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Title, type badge, visibility badge, and delete action */}
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

      {/* Type-specific detail section (if any) */}
      {DetailComponent && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white">
            Details
          </h2>
          <DetailComponent node={node} />
        </section>
      )}

      {/* Parent selector: only shown to users who can edit this node */}
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

      {/* Read-only link to the parent node */}
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

      {/* Read-only list of child nodes */}
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

      {/* Incoming and outgoing manually-created node links */}
      <LinksSection node={node} campaignId={campaignId!} />

      {/* Tag pills */}
      <TagsSection tags={node.tags} />

      {/* Blocks: free-form content attached to the node */}
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

      {/* Add Block modal */}
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
