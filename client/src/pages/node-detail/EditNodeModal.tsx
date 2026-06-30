import { useState } from "react";
import type { Node, Visibility } from "../../types";

/**
 * ============================================================================
 * node-detail/EditNodeModal.tsx
 * ============================================================================
 *
 * Modal dialog for editing a node's title, deleting the node, or starting a
 * merge with another node. Which actions are available depends on the caller's
 * permissions.
 */

interface Props {
  node: Node;
  canEdit: boolean;
  canMerge: boolean;
  onUpdate: (data: { title: string; visibility: Visibility }) => Promise<void>;
  onDelete: () => void;
  onMerge: () => void;
  onClose: () => void;
  isUpdating: boolean;
}

/**
 * EditNodeModal – simple modal for renaming a node, deleting it, or starting a
 * merge. The merge option is shown for DMs and Loremasters.
 */
export function EditNodeModal({
  node,
  canEdit,
  canMerge,
  onUpdate,
  onDelete,
  onMerge,
  onClose,
  isUpdating,
}: Props) {
  const [title, setTitle] = useState(node.title);
  const [visibility, setVisibility] = useState<Visibility>(node.visibility);

  /** Persists the new title and visibility, then closes the modal. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate({ title, visibility });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-elevated p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-primary">Edit Node</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-primary dark:text-secondary">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={!canEdit}
              className="w-full rounded-lg border border-default px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60 dark:border-default dark:bg-surface dark:text-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-primary dark:text-secondary">
              Visibility
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Visibility)}
              disabled={!canEdit}
              className="w-full rounded-lg border border-default px-3 py-2 text-sm disabled:opacity-60 dark:border-default dark:bg-surface dark:text-primary"
            >
              <option value="PRIVATE">PRIVATE</option>
              <option value="PUBLIC">PUBLIC</option>
              <option value="DM_ONLY">DM_ONLY</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="rounded-lg bg-danger-subtle px-4 py-2 text-sm font-medium text-danger hover:bg-danger-subtle dark:bg-danger-subtle dark:text-danger dark:hover:bg-danger-subtle"
                >
                  Delete
                </button>
              )}
              {canMerge && (
                <button
                  type="button"
                  onClick={onMerge}
                  className="rounded-lg bg-accent-subtle px-4 py-2 text-sm font-medium text-accent hover:bg-accent-subtle dark:bg-accent-subtle dark:text-accent dark:hover:bg-accent-subtle"
                >
                  Merge
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-primary hover:bg-surface dark:text-secondary dark:hover:bg-surface"
              >
                Cancel
              </button>
              {canEdit && (
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-text-on-accent hover:bg-accent-hover disabled:opacity-50"
                >
                  {isUpdating ? "Saving..." : "Save"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
