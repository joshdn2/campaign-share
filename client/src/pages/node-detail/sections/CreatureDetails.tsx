import type { Node } from "../../../types";

/**
 * ============================================================================
 * node-detail/sections/CreatureDetails.tsx
 * ============================================================================
 *
 * Detail section for CREATURE nodes. Displays creature fields such as species,
 * size, challenge rating, habitat, and abilities.
 */

interface Props {
  node: Node;
}

/**
 * CreatureDetails – renders creature-specific fields.
 *
 * Only fields that are present on the `creatureDetail` object are rendered.
 */
export function CreatureDetails({ node }: Props) {
  if (!node.creatureDetail) return null;
  const d = node.creatureDetail;

  return (
    <div className="grid gap-2 text-sm text-muted dark:text-secondary sm:grid-cols-2">
      {d.species && <p><span className="font-medium">Species:</span> {d.species}</p>}
      {d.size && <p><span className="font-medium">Size:</span> {d.size}</p>}
      {d.challengeRating && <p><span className="font-medium">CR:</span> {d.challengeRating}</p>}
      {d.habitat && <p><span className="font-medium">Habitat:</span> {d.habitat}</p>}
      {d.abilities && <p className="col-span-2"><span className="font-medium">Abilities:</span> {d.abilities}</p>}
    </div>
  );
}
