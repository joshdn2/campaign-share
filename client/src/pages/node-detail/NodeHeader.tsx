import { useState } from "react";
import type { Node } from "../../types";

/**
 * ============================================================================
 * node-detail/NodeHeader.tsx
 * ============================================================================
 *
 * Renders the node title, type badge, visibility badge, and delete button.
 * Users with edit permission can switch the title to inline edit mode.
 */

interface Props {
  node: Node;
  canEdit: boolean;
  canDelete: boolean;
  onUpdateTitle: (title: string) => Promise<void>;
  onDelete: () => void;
  isUpdating: boolean;
}

/**
 * NodeHeader – node title bar with type and visibility badges.
 *
 * State:
 *  - editing: toggles the inline title editor
 *  - editTitle: controlled input value for the title editor
 */
export function NodeHeader({ node, canEdit, canDelete, onUpdateTitle, onDelete, isUpdating }: Props) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);

  /** Persists the new title and exits edit mode. */
  const save = async () => {
    await onUpdateTitle(editTitle);
    setEditing(false);
  };

  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        {editing ? (
          // Inline title editor
          <div className="flex items-center gap-2">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="flex-1 rounded-lg border border-default px-3 py-2 text-2xl font-bold focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-default dark:bg-surface dark:text-primary"
            />
            <button
              onClick={save}
              disabled={isUpdating}
              className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-text-on-accent hover:bg-accent-hover"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-surface dark:text-secondary dark:hover:bg-surface"
            >
              Cancel
            </button>
          </div>
        ) : (
          // Read-only title with edit trigger
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary">{node.title}</h1>
            {canEdit && (
              <button
                onClick={() => {
                  setEditTitle(node.title);
                  setEditing(true);
                }}
                className="rounded-md px-2 py-1 text-sm text-muted hover:bg-surface dark:text-secondary dark:hover:bg-surface"
              >
                Edit
              </button>
            )}
          </div>
        )}

        {/* Badges row */}
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded bg-surface px-2 py-0.5 text-xs font-medium text-muted dark:bg-surface dark:text-secondary">
            {node.type}
          </span>
          <VisibilityBadge visibility={node.visibility} />
        </div>
      </div>

      {/* Delete action */}
      {canDelete && (
        <button
          onClick={onDelete}
          className="rounded-lg bg-danger-subtle px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-subtle dark:bg-danger-subtle dark:text-danger dark:hover:bg-danger-subtle"
        >
          Delete
        </button>
      )}
    </div>
  );
}

/**
 * VisibilityBadge – small colored pill that displays the node visibility.
 */
function VisibilityBadge({ visibility }: { visibility: string }) {
  const styles =
    visibility === "PUBLIC"
      ? "bg-success-subtle text-success dark:bg-success-subtle dark:text-success"
      : visibility === "PRIVATE"
        ? "bg-warning-subtle text-warning dark:bg-warning-subtle dark:text-warning"
        : "bg-accent-subtle text-accent dark:bg-accent-subtle dark:text-accent";

  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${styles}`}>{visibility}</span>
  );
}
