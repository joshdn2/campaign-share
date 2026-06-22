import { useState, useRef } from "react";
import { TaggedText } from "../../components/blocks/TaggedText";
import { NodeTagInsert } from "../../components/blocks/NodeTagInsert";
import type { NodeBlock, Visibility } from "../../types";

/**
 * ============================================================================
 * node-detail/BlocksSection.tsx
 * ============================================================================
 *
 * Renders the list of blocks attached to a node and supports inline editing
 * and deletion. Permission to edit a block is granted when:
 *  - the user can edit the node (`canEdit`), AND
 *  - the user is the block's author OR the campaign DM.
 *
 * TEXT blocks support "@" tagging of other nodes in the campaign. Tags are
 * stored as `@[Node Title](node-id)` and rendered as clickable links.
 */

interface Props {
  blocks: NodeBlock[];
  canEdit: boolean;
  currentUserId: string;
  isDm: boolean;
  onEdit: (blockId: string, content: Record<string, unknown>, visibility: Visibility) => Promise<void>;
  onDelete: (blockId: string) => void;
  /** Campaign id used for tag search and rendering tagged links. */
  campaignId: string;
  /** Node that owns these blocks (excluded from tag search). */
  nodeId: string;
}

/**
 * BlocksSection – lists all blocks for a node with inline edit/delete controls.
 *
 * State:
 *  - editingBlock: id of the block currently in edit mode, or null
 *  - editContent: textarea value for the block being edited
 *  - editVisibility: visibility value for the block being edited
 */
export function BlocksSection({
  blocks,
  canEdit,
  currentUserId,
  isDm,
  onEdit,
  onDelete,
  campaignId,
  nodeId,
}: Props) {
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editVisibility, setEditVisibility] = useState<Visibility>("PUBLIC");

  /** Copies the block's current values into the edit form and enters edit mode. */
  const startEditing = (block: NodeBlock) => {
    setEditingBlock(block.id);
    setEditContent((block.content.text as string) || "");
    setEditVisibility(block.visibility);
  };

  /** Persists the edited block content and visibility, then exits edit mode. */
  const save = async (blockId: string) => {
    await onEdit(blockId, { text: editContent }, editVisibility);
    setEditingBlock(null);
  };

  return (
    <div className="space-y-3">
      {blocks.map((block) => (
        <BlockCard
          key={block.id}
          block={block}
          isEditing={editingBlock === block.id}
          editContent={editContent}
          editVisibility={editVisibility}
          onContentChange={setEditContent}
          onVisibilityChange={setEditVisibility}
          onStartEdit={() => startEditing(block)}
          onSave={() => save(block.id)}
          onCancel={() => setEditingBlock(null)}
          onDelete={() => onDelete(block.id)}
          canEdit={canEdit && (block.authorId === currentUserId || isDm)}
          campaignId={campaignId}
          nodeId={nodeId}
        />
      ))}

      {/* Empty state when the node has no blocks yet */}
      {blocks.length === 0 && (
        <p className="py-4 text-center text-sm text-muted dark:text-secondary">
          No blocks yet. Add one to get started.
        </p>
      )}
    </div>
  );
}

/**
 * BlockCard – renders a single block.
 *
 * In edit mode it shows a textarea and visibility selector. In read mode it
 * shows the block metadata (type, visibility, author) and action buttons for
 * users who are allowed to edit.
 */
function BlockCard({
  block,
  isEditing,
  editContent,
  editVisibility,
  onContentChange,
  onVisibilityChange,
  onStartEdit,
  onSave,
  onCancel,
  onDelete,
  canEdit,
  campaignId,
  nodeId,
}: {
  block: NodeBlock;
  isEditing: boolean;
  editContent: string;
  editVisibility: Visibility;
  onContentChange: (v: string) => void;
  onVisibilityChange: (v: Visibility) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  canEdit: boolean;
  campaignId: string;
  nodeId: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Color-code the block card border based on visibility.
  const borderClass =
    block.visibility === "PRIVATE"
      ? "border-warning-subtle bg-warning-subtle dark:border-warning-subtle dark:bg-warning-subtle/10"
      : block.visibility === "DM_ONLY"
        ? "border-accent-subtle bg-accent-subtle dark:border-accent-subtle dark:bg-accent-subtle"
        : "border-transparent";

  const isTextBlock = block.type === "TEXT";

  return (
    <div className={`rounded-lg border bg-item-bg p-4 ${borderClass}`}>
      {isEditing ? (
        // Inline edit form
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => onContentChange(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-default px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-default dark:bg-surface dark:text-primary"
          />
          {isTextBlock && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted dark:text-secondary">Tag a node:</span>
              <NodeTagInsert
                campaignId={campaignId}
                currentNodeId={nodeId}
                textareaRef={textareaRef}
                content={editContent}
                onChange={onContentChange}
              />
            </div>
          )}
          <select
            value={editVisibility}
            onChange={(e) => onVisibilityChange(e.target.value as Visibility)}
            className="rounded-lg border border-default px-2 py-1 text-sm dark:border-default dark:bg-surface dark:text-primary"
          >
            <option value="PRIVATE">PRIVATE</option>
            <option value="PUBLIC">PUBLIC</option>
            <option value="DM_ONLY">DM_ONLY</option>
          </select>
          <div className="flex gap-2">
            <button onClick={onSave} className="rounded-lg bg-accent px-3 py-1 text-sm text-text-on-accent hover:bg-accent-hover">
              Save
            </button>
            <button
              onClick={onCancel}
              className="rounded-lg px-3 py-1 text-sm text-muted hover:bg-surface dark:text-secondary dark:hover:bg-surface"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // Read-only view
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted dark:text-secondary">{block.type}</span>
              <VisibilityBadge visibility={block.visibility} />
              <span className="text-xs text-secondary dark:text-muted">by {block.author.displayName}</span>
            </div>
            {canEdit && (
              <div className="flex gap-1">
                <button
                  onClick={onStartEdit}
                  className="rounded px-2 py-0.5 text-xs text-muted hover:bg-surface dark:text-secondary dark:hover:bg-surface"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this block?")) onDelete();
                  }}
                  className="rounded px-2 py-0.5 text-xs text-danger hover:bg-danger-subtle dark:hover:bg-danger-subtle"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          <div className="text-sm text-primary dark:text-secondary">
            {isTextBlock ? (
              <TaggedText text={(block.content.text as string) || ""} campaignId={campaignId} />
            ) : (
              <span className="whitespace-pre-wrap">{(block.content.text as string) || ""}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * VisibilityBadge – small colored pill that displays a block or node visibility.
 */
function VisibilityBadge({ visibility }: { visibility: string }) {
  const styles =
    visibility === "PUBLIC"
      ? "bg-success-subtle text-success dark:bg-success-subtle dark:text-success"
      : visibility === "PRIVATE"
        ? "bg-warning-subtle text-warning dark:bg-warning-subtle dark:text-warning"
        : "bg-accent-subtle text-accent dark:bg-accent-subtle dark:text-accent";

  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${styles}`}>{visibility}</span>
  );
}
