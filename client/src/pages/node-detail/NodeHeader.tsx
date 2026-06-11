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
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-2xl font-bold focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <button
              onClick={save}
              disabled={isUpdating}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        ) : (
          // Read-only title with edit trigger
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{node.title}</h1>
            {canEdit && (
              <button
                onClick={() => {
                  setEditTitle(node.title);
                  setEditing(true);
                }}
                className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Edit
              </button>
            )}
          </div>
        )}

        {/* Badges row */}
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {node.type}
          </span>
          <VisibilityBadge visibility={node.visibility} />
        </div>
      </div>

      {/* Delete action */}
      {canDelete && (
        <button
          onClick={onDelete}
          className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
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
      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      : visibility === "PRIVATE"
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
        : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";

  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${styles}`}>{visibility}</span>
  );
}
