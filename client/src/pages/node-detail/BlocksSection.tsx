import { useState } from "react";
import type { JSONContent } from "@tiptap/core";
import { RichTextEditor } from "../../components/blocks/RichTextEditor";
import { RichTextRenderer } from "../../components/blocks/RichTextRenderer";
import type { NodeBlock, Visibility } from "../../types";

/**
 * ============================================================================
 * node-detail/BlocksSection.tsx
 * ============================================================================
 *
 * Renders the list of rich-text blocks attached to a node and supports inline
 * editing and deletion. Permission to edit or delete a block is granted when:
 *  - the user is the campaign DM, OR
 *  - the user is a Loremaster, OR
 *  - the user is the block's author (any player can manage their own blocks).
 */

interface Props {
  blocks: NodeBlock[];
  currentUserId: string;
  isDm: boolean;
  isLoremaster: boolean;
  onEdit: (
    blockId: string,
    content: Record<string, unknown>,
    visibility: Visibility,
  ) => Promise<void>;
  onDelete: (blockId: string) => void;
}

const emptyRichText: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function getRichTextContent(block: NodeBlock): JSONContent {
  const content = block.content.content;
  if (content && typeof content === "object") {
    return content as JSONContent;
  }
  return emptyRichText;
}

/**
 * BlocksSection – lists all blocks for a node with inline edit/delete controls.
 *
 * State:
 *  - editingBlock: id of the block currently in edit mode, or null
 *  - editRichContent: TipTap JSON for the block being edited
 *  - editVisibility: visibility value for the block being edited
 */
export function BlocksSection({
  blocks,
  currentUserId,
  isDm,
  isLoremaster,
  onEdit,
  onDelete,
}: Props) {
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editRichContent, setEditRichContent] =
    useState<JSONContent>(emptyRichText);
  const [editVisibility, setEditVisibility] = useState<Visibility>("PUBLIC");

  /** Copies the block's current values into the edit form and enters edit mode. */
  const startEditing = (block: NodeBlock) => {
    setEditingBlock(block.id);
    setEditRichContent(getRichTextContent(block));
    setEditVisibility(block.visibility);
  };

  /** Persists the edited block content and visibility, then exits edit mode. */
  const save = async (blockId: string) => {
    await onEdit(blockId, { content: editRichContent }, editVisibility);
    setEditingBlock(null);
  };

  return (
    <div className="space-y-2">
      {blocks.map((block) => (
        <BlockCard
          key={block.id}
          block={block}
          isEditing={editingBlock === block.id}
          editRichContent={editRichContent}
          editVisibility={editVisibility}
          onRichContentChange={setEditRichContent}
          onVisibilityChange={setEditVisibility}
          onStartEdit={() => startEditing(block)}
          onSave={() => save(block.id)}
          onCancel={() => setEditingBlock(null)}
          onDelete={() => onDelete(block.id)}
          canEdit={isDm || isLoremaster || block.authorId === currentUserId}
        />
      ))}

      {/* Empty state when the node has no blocks yet */}
      {blocks.length === 0 && (
        <p className="py-3 text-center text-sm text-muted dark:text-secondary">
          No blocks yet. Add one to get started.
        </p>
      )}
    </div>
  );
}

/**
 * BlockCard – renders a single block.
 *
 * In edit mode it shows the rich-text editor and visibility selector. In read
 * mode it shows the block metadata (visibility, author) and action buttons for
 * users who are allowed to edit.
 */
function BlockCard({
  block,
  isEditing,
  editRichContent,
  editVisibility,
  onRichContentChange,
  onVisibilityChange,
  onStartEdit,
  onSave,
  onCancel,
  onDelete,
  canEdit,
}: {
  block: NodeBlock;
  isEditing: boolean;
  editRichContent: JSONContent;
  editVisibility: Visibility;
  onRichContentChange: (v: JSONContent) => void;
  onVisibilityChange: (v: Visibility) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  canEdit: boolean;
}) {
  return (
    <div
      className={`relative rounded-lg border bg-item-bg px-3 py-2 border-transparent`}
    >
      {isEditing ? (
        // Inline edit form
        <div className="space-y-2">
          <RichTextEditor
            content={editRichContent}
            onChange={onRichContentChange}
          />
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
            <button
              onClick={onSave}
              className="rounded-lg bg-accent px-3 py-1 text-sm text-text-on-accent hover:bg-accent-hover"
            >
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
          <VisibilityBadge visibility={block.visibility} />
          <div className="mb-2 flex items-center justify-between pr-14">
            <span className="text-xs text-secondary dark:text-muted">
              by {block.author.username}
            </span>
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
          <div className="text-sm">
            <RichTextRenderer content={getRichTextContent(block)} />
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
        ? "bg-danger-subtle text-danger dark:bg-danger-subtle dark:text-danger"
        : "bg-accent-subtle text-accent dark:bg-accent-subtle dark:text-accent";

  return (
    <span
      className={`absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-medium ${styles}`}
    >
      {visibility}
    </span>
  );
}
