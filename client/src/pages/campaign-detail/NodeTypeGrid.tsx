import { useNavigate } from "react-router-dom";
import type { Node } from "../../types";

// Displays a grid of node cards for a specific type (e.g., Characters, Locations).
interface Props {
  campaignId: string;
  label: string;
  nodes: Node[];
}

export function NodeTypeGrid({ campaignId, label, nodes }: Props) {
  const navigate = useNavigate();

  if (nodes.length === 0) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
        {label}s
      </h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {nodes.map((node) => (
          <button
            key={node.id}
            onClick={() =>
              navigate(`/campaigns/${campaignId}/nodes/${node.id}`)
            }
            className="rounded-lg border border-gray-100 p-3 text-left hover:border-blue-200 hover:bg-blue-50 dark:border-gray-800 dark:hover:border-blue-900 dark:hover:bg-blue-900/10"
          >
            <span className="font-medium text-gray-800 dark:text-white">
              {node.title}
            </span>
            {node.excerpt && (
              <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                {node.excerpt}
              </p>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
