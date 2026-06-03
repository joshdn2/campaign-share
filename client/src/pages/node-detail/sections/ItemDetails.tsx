import type { Node } from "../../../types";

// Displays item-specific fields.
export function ItemDetails({ node }: { node: Node }) {
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
