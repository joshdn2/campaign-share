import type { Node } from "../../../types";

// Displays creature-specific fields.
export function CreatureDetails({ node }: { node: Node }) {
  if (!node.creatureDetail) return null;
  const d = node.creatureDetail;

  return (
    <div className="grid gap-2 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-2">
      {d.species && <p><span className="font-medium">Species:</span> {d.species}</p>}
      {d.size && <p><span className="font-medium">Size:</span> {d.size}</p>}
      {d.challengeRating && <p><span className="font-medium">CR:</span> {d.challengeRating}</p>}
      {d.habitat && <p><span className="font-medium">Habitat:</span> {d.habitat}</p>}
      {d.abilities && <p className="col-span-2"><span className="font-medium">Abilities:</span> {d.abilities}</p>}
    </div>
  );
}
