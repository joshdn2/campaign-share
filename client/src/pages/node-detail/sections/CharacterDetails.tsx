import type { Node } from "../../../types";

// Displays character-specific fields in a two-column grid.
export function CharacterDetails({ node }: { node: Node }) {
  if (!node.characterDetail) return null;
  const d = node.characterDetail;

  return (
    <div className="grid gap-2 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-2">
      {d.race && <p><span className="font-medium">Race:</span> {d.race}</p>}
      {d.class && <p><span className="font-medium">Class:</span> {d.class}</p>}
      {d.level != null && <p><span className="font-medium">Level:</span> {d.level}</p>}
      {d.alignment && <p><span className="font-medium">Alignment:</span> {d.alignment}</p>}
      {d.gender && <p><span className="font-medium">Gender:</span> {d.gender}</p>}
      {d.age && <p><span className="font-medium">Age:</span> {d.age}</p>}
      <p><span className="font-medium">PC:</span> {d.isPC ? "Yes" : "No"}</p>
      {d.physicalDescription && <p className="col-span-2"><span className="font-medium">Description:</span> {d.physicalDescription}</p>}
      {d.personality && <p className="col-span-2"><span className="font-medium">Personality:</span> {d.personality}</p>}
      {d.goals && <p className="col-span-2"><span className="font-medium">Goals:</span> {d.goals}</p>}
      {d.secrets && <p className="col-span-2"><span className="font-medium">Secrets:</span> {d.secrets}</p>}
      {d.abilities && <p className="col-span-2"><span className="font-medium">Abilities:</span> {d.abilities}</p>}
      {d.voice && <p className="col-span-2"><span className="font-medium">Voice:</span> {d.voice}</p>}
      {d.mannerisms && <p className="col-span-2"><span className="font-medium">Mannerisms:</span> {d.mannerisms}</p>}
    </div>
  );
}
