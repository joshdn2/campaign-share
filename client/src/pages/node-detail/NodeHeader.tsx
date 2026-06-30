import type { Node } from "../../types";

/**
 * ============================================================================
 * node-detail/NodeHeader.tsx
 * ============================================================================
 *
 * Renders the node title, type badge, visibility badge, and an edit trigger.
 * The actual editing and deletion happen inside EditNodeModal.
 */

interface Props {
  node: Node;
  canEdit: boolean;
  onEdit: () => void;
}

/**
 * NodeHeader – node title bar with type and visibility badges.
 */
export function NodeHeader({ node, canEdit, onEdit }: Props) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-primary mr-2">{node.title}</h1>
          {/* <span className="rounded bg-surface px-2 py-0.5 text-xs font-medium text-muted dark:bg-surface dark:text-secondary">
            {node.type}
          </span> */}
          <VisibilityBadge visibility={node.visibility} />
          {canEdit && (
            <button
              onClick={onEdit}
              className="rounded-md px-2 py-1 text-sm text-muted hover:bg-surface dark:text-secondary dark:hover:bg-surface"
            >
              Edit
            </button>
          )}
        </div>
      </div>
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
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${styles}`}>
      {visibility}
    </span>
  );
}
