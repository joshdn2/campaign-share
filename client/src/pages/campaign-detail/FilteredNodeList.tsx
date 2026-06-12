import { useNavigate } from "react-router-dom";
import type { Node } from "../../types";

/**
 * ============================================================================
 * campaign-detail/FilteredNodeList.tsx
 * ============================================================================
 *
 * Renders a dedicated list view for a single node type. This replaces the full
 * campaign dashboard when the user selects a node type from the sidebar.
 *
 * Props:
 *  - campaignId: used to build detail-page links
 *  - label: human-readable singular label (e.g. "Character")
 *  - nodes: nodes matching the selected type
 *  - onCreate: opens the create-node modal for this type
 *  - onClear: removes the `?type=...` filter and returns to the dashboard
 */

interface Props {
  campaignId: string;
  label: string;
  nodes: Node[];
  onCreate: () => void;
  onClear: () => void;
}

/**
 * FilteredNodeList – shows nodes of a single type, sorted by most recently edited.
 *
 * Sorting uses `updatedAt` so the most active nodes appear at the top.
 */
export function FilteredNodeList({
  campaignId,
  label,
  nodes,
  onCreate,
  onClear,
}: Props) {
  const navigate = useNavigate();

  // Sort a shallow copy so we do not mutate the query result cache.
  const sorted = [...nodes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 md:p-6 dark:border-gray-700 dark:bg-gray-900">
      {/* Header with create/back actions */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          {label}s
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onCreate}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Create {label}
          </button>
          <button
            onClick={onClear}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Back
          </button>
        </div>
      </div>

      {/* List of nodes */}
      <div className="space-y-2">
        {sorted.map((node) => (
          <button
            key={node.id}
            onClick={() =>
              navigate(`/campaigns/${campaignId}/nodes/${node.id}`)
            }
            className="flex w-full items-center justify-between rounded-lg border border-gray-100 p-3 text-left hover:border-blue-200 hover:bg-blue-50 dark:border-gray-800 dark:hover:border-blue-900 dark:hover:bg-blue-900/10"
          >
            <div>
              <span className="font-medium text-gray-800 dark:text-white">
                {node.title}
              </span>
              {node.excerpt && (
                <p className="mt-0.5 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                  {node.excerpt}
                </p>
              )}
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {new Date(node.updatedAt).toLocaleDateString()}
            </span>
          </button>
        ))}

        {/* Empty state */}
        {sorted.length === 0 && (
          <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No {label.toLowerCase()}s found.
          </p>
        )}
      </div>
    </section>
  );
}
