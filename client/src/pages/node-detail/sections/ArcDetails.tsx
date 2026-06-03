import type { Node } from "../../../types";

// Displays arc-specific fields: arc number and description.
export function ArcDetails({ node }: { node: Node }) {
  if (!node.arcDetail) return null;

  return (
    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
      <p>
        <span className="font-medium">Arc Number:</span> {node.arcDetail.arcNumber}
      </p>
      {node.arcDetail.description && <p>{node.arcDetail.description}</p>}
    </div>
  );
}
