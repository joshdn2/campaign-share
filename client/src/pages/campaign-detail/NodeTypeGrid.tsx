import { useNavigate } from "react-router-dom";
import type { Node } from "../../types";

/**
 * ============================================================================
 * campaign-detail/NodeTypeGrid.tsx
 * ============================================================================
 *
 * Renders a card grid for one node type on the campaign detail page.
 * If there are no nodes of this type, the section is hidden.
 */

interface Props {
  campaignId: string;
  label: string;
  nodes: Node[];
}

/**
 * NodeTypeGrid – displays a grid of node cards for a specific type.
 *
 * Examples: Characters, Locations, Items, Creatures, Factions, Notes.
 * Clicking a card navigates to the node's detail page.
 */
export function NodeTypeGrid({ campaignId, label, nodes }: Props) {
  const navigate = useNavigate();

  // Hide the entire section if there is nothing to show for this type.
  if (nodes.length === 0) return null;

  return (
    <section className="rounded-xl border border-transparent bg-accent-subtle p-4 md:p-6">
      <h2 className="mb-4 text-lg font-semibold text-primary">{label}s</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {nodes.map((node) => (
          <button
            key={node.id}
            onClick={() =>
              navigate(`/campaigns/${campaignId}/nodes/${node.id}`)
            }
            className="group rounded-lg border border-accent/30 bg-item-bg p-3 text-left transition-colors hover:border-accent hover:bg-base"
          >
            <span className="font-medium text-primary transition-colors">
              {node.title}
            </span>
            {node.excerpt && (
              <p className="mt-1 line-clamp-1 text-xs text-muted dark:text-secondary">
                {node.excerpt}
              </p>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
