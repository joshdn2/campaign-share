import type { Node } from "../../../types";

/**
 * ============================================================================
 * node-detail/sections/ItemDetails.tsx
 * ============================================================================
 *
 * Detail section for ITEM nodes. Displays item fields such as type, rarity,
 * value, weight, attunement requirement, and abilities.
 */

interface Props {
  node: Node;
}

/**
 * ItemDetails – renders item-specific fields.
 *
 * Only fields that are present on the `itemDetail` object are rendered.
 */
export function ItemDetails({ node }: Props) {
  if (!node.itemDetail) return null;
  const d = node.itemDetail;

  return (
    <div className="grid gap-2 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-2">
      {d.itemType && <p><span className="font-medium">Type:</span> {d.itemType}</p>}
      {d.rarity && <p><span className="font-medium">Rarity:</span> {d.rarity}</p>}
      {d.value && <p><span className="font-medium">Value:</span> {d.value}</p>}
      {d.weight && <p><span className="font-medium">Weight:</span> {d.weight}</p>}
      <p><span className="font-medium">Attunement:</span> {d.requiresAttunement ? "Required" : "Not required"}</p>
      {d.abilities && <p className="col-span-2"><span className="font-medium">Abilities:</span> {d.abilities}</p>}
    </div>
  );
}
