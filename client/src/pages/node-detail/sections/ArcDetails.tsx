import type { Node } from "../../../types";

/**
 * ============================================================================
 * node-detail/sections/ArcDetails.tsx
 * ============================================================================
 *
 * Detail section for ARC nodes. Displays the arc number and an optional
 * longer description.
 */

interface Props {
  node: Node;
}

/**
 * ArcDetails – renders arc-specific fields.
 *
 * If the node has no `arcDetail` record, the component returns null.
 */
export function ArcDetails({ node }: Props) {
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
