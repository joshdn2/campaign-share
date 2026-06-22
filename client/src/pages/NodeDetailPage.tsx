import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useNode,
  useUpdateNode,
  useDeleteNode,
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
// Sub-components
import { NodeHeader } from "./node-detail/NodeHeader";
import { TagsSection } from "./node-detail/TagsSection";
import { BlocksSection } from "./node-detail/BlocksSection";
import { AddBlockModal } from "./node-detail/AddBlockModal";
import { ParentBreadcrumbs } from "./node-detail/ParentBreadcrumbs";
import { NodeDetailsAndLinks } from "./node-detail/NodeDetailsAndLinks";
import type { NodeType } from "../types";

/**
 * ============================================================================
 * NodeDetailPage.tsx
 * ============================================================================
 *
 * Top-level route component for viewing any type of node.
 * Route: /campaigns/:campaignId/nodes/:nodeId
 *
 * Layout:
 *  - Node header (title, type/visibility badges, delete action).
 *  - Breadcrumb trail of ancestor nodes under the title.
 *  - A shared collapsible "Details & Links" panel. On wide screens Details
 *    occupies the left two thirds and Links sits in a sidebar on the right.
 *    On narrow screens they stack. Both inner cards stretch to equal height.
 *  - Blocks section as the primary, always-visible content area.
 *  - Children and tags rendered below blocks when present.
 *
 * Responsibilities:
 *  - Load the requested node and its blocks.
 *  - Render the node header, type-specific details, links, tags, and blocks.
 *  - Allow editing/deleting the node title when the user owns the node or is DM.
 *  - Support adding new blocks through a modal.
 */

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  SESSION: "Session",
  CHARACTER: "Character",
  CREATURE: "Creature",
  ITEM: "Item",
  LOCATION: "Location",
  NOTE: "Note",
  FACTION: "Faction",
};

/**
 * NodeDetailPage – full view for any node type.
 *
 * Reads `campaignId` and `nodeId` from the URL. Shows the node header,
 * ancestor breadcrumbs, collapsible details/links panel, and the main blocks
 * section.
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

  const typeLabel = NODE_TYPE_LABELS[node.type];

  return (
    <div className="space-y-6">
      {/* Back link to the filtered list for this node type */}
      <button
        onClick={() => navigate(`/campaigns/${campaignId}?type=${node.type}`)}
        className="text-sm text-accent hover:underline dark:text-accent"
      >
        ← Back to {typeLabel}s
      </button>

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

      {/* Breadcrumb trail of ancestor nodes (e.g. Westbridge › The Rusty Anchor). */}
      <ParentBreadcrumbs
        ancestors={node.ancestors || []}
        campaignId={campaignId!}
        currentTitle={node.title}
      />

      {/* Shared collapsible panel: Details (main) + Links (sidebar). */}
      <NodeDetailsAndLinks node={node} campaignId={campaignId!} blocks={blocks} />

      {/* Blocks: free-form content attached to the node (the main feature). */}
      <section className="rounded-xl border border-transparent bg-card-bg p-4 md:p-6 ">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">
            Blocks
          </h2>
          <button
            onClick={() => setShowAddBlock(true)}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-text-on-accent hover:bg-accent-hover"
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
            await updateBlock.mutateAsync({
              blockId,
              data: { content, visibility },
            });
          }}
          onDelete={(blockId) => {
            if (confirm("Delete this block?")) deleteBlock.mutate(blockId);
          }}
          campaignId={campaignId!}
          nodeId={nodeId!}
        />
      </section>

      {/* Read-only list of child nodes */}
      {node.children && node.children.length > 0 && (
        <section className="rounded-xl border border-transparent bg-card-bg p-4 ">
          <h3 className="mb-2 text-sm font-semibold text-primary dark:text-secondary">
            Children
          </h3>
          <div className="flex flex-wrap gap-2">
            {node.children.map((child) => (
              <button
                key={child.id}
                onClick={() =>
                  navigate(`/campaigns/${campaignId}/nodes/${child.id}`)
                }
                className="rounded-lg border border-transparent bg-item-bg px-3 py-1 text-sm text-primary transition-colors hover:bg-accent-subtle"
              >
                {child.title}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Tag pills */}
      <TagsSection tags={node.tags} />

      {/* Add Block modal */}
      {showAddBlock && (
        <AddBlockModal
          onAdd={async (data) => {
            await createBlock.mutateAsync(data);
          }}
          onClose={() => setShowAddBlock(false)}
          isPending={createBlock.isPending}
          campaignId={campaignId!}
          nodeId={nodeId!}
        />
      )}
    </div>
  );
}
