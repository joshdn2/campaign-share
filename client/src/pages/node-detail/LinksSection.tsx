import { useNavigate } from "react-router-dom";
import type { Node } from "../../types";

/**
 * ============================================================================
 * node-detail/LinksSection.tsx
 * ============================================================================
 *
 * Renders manually-created relationships between nodes.
 * Outgoing links point to other nodes; incoming links come from other nodes.
 * The section is hidden when the node has no links in either direction.
 */

interface Props {
  node: Node;
  campaignId: string;
}

/**
 * LinksSection – renders incoming and outgoing node links.
 *
 * Each link is rendered as a button that navigates to the linked node's
 * detail page. Links may have an optional label (e.g. "Located in").
 */
export function LinksSection({ node, campaignId }: Props) {
  const navigate = useNavigate();

  // Nothing to render if both directions are empty.
  if (!node.outgoingLinks?.length && !node.incomingLinks?.length) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white">Links</h2>

      {/* Outgoing links: this node -> target nodes */}
      {node.outgoingLinks && node.outgoingLinks.length > 0 && (
        <div className="mb-3">
          <h3 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Outgoing</h3>
          <div className="flex flex-wrap gap-2">
            {node.outgoingLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => navigate(`/campaigns/${campaignId}/nodes/${link.target!.id}`)}
                className="rounded-lg bg-blue-50 px-3 py-1 text-sm text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
              >
                {link.label ? `${link.label}: ` : ""}
                {link.target!.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Incoming links: source nodes -> this node */}
      {node.incomingLinks && node.incomingLinks.length > 0 && (
        <div>
          <h3 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Incoming</h3>
          <div className="flex flex-wrap gap-2">
            {node.incomingLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => navigate(`/campaigns/${campaignId}/nodes/${link.source!.id}`)}
                className="rounded-lg bg-green-50 px-3 py-1 text-sm text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30"
              >
                {link.label ? `${link.label}: ` : ""}
                {link.source!.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
