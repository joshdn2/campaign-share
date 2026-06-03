import { useNavigate } from "react-router-dom";
import type { Node } from "../../types";

// Renders incoming and outgoing node links.
export function LinksSection({ node, campaignId }: { node: Node; campaignId: string }) {
  const navigate = useNavigate();

  if (!node.outgoingLinks?.length && !node.incomingLinks?.length) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white">Links</h2>

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
