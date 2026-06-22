/**
 * ParentBreadcrumbs.tsx
 *
 * Renders a breadcrumb trail showing the hierarchy above the current node.
 * Each ancestor is a clickable link to its detail page. The current node's
 * title is shown at the end of the trail as plain text.
 */

import { useNavigate } from "react-router-dom";
import type { NodeType } from "../../types";

interface Props {
  /** Ordered list of ancestors from root to immediate parent. */
  ancestors: Array<{ id: string; title: string; type: NodeType }>;
  /** Id of the campaign the node belongs to, used for link paths. */
  campaignId: string;
  /** Title of the current node, shown as the final non-link segment. */
  currentTitle: string;
}

/**
 * Renders ancestor links followed by the current node title.
 *
 * Example: Westbridge › The Rusty Anchor › Current Node
 */
export function ParentBreadcrumbs({
  ancestors,
  campaignId,
  currentTitle,
}: Props) {
  const navigate = useNavigate();

  if (ancestors.length === 0) return null;

  return (
    <nav
      className="text-sm text-muted dark:text-secondary"
      aria-label="Parent breadcrumbs"
    >
      {ancestors.map((ancestor) => (
        <span key={ancestor.id}>
          <button
            onClick={() =>
              navigate(`/campaigns/${campaignId}/nodes/${ancestor.id}`)
            }
            className="hover:text-accent hover:underline dark:hover:text-accent"
          >
            {ancestor.title}
          </button>
          <span className="mx-1.5 text-accent">›</span>
        </span>
      ))}
      <span className="font-medium text-primary">
        {currentTitle}
      </span>
    </nav>
  );
}
