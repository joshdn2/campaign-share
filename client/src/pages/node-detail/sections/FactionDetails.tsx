import type { Node } from "../../../types";

// Displays faction-specific fields.
export function FactionDetails({ node }: { node: Node }) {
  if (!node.factionDetail) return null;
  const d = node.factionDetail;

  return (
    <div className="grid gap-2 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-2">
      {d.factionType && <p><span className="font-medium">Type:</span> {d.factionType}</p>}
      {d.alignment && <p><span className="font-medium">Alignment:</span> {d.alignment}</p>}
      {d.size && <p><span className="font-medium">Size:</span> {d.size}</p>}
      {d.reach && <p><span className="font-medium">Reach:</span> {d.reach}</p>}
      {d.influenceLevel && <p><span className="font-medium">Influence:</span> {d.influenceLevel}</p>}
      {d.leaderName && <p><span className="font-medium">Leader:</span> {d.leaderName}</p>}
      {d.headquarters && <p><span className="font-medium">HQ:</span> {d.headquarters}</p>}
      {d.resources && <p className="col-span-2"><span className="font-medium">Resources:</span> {d.resources}</p>}
      {d.publicImage && <p className="col-span-2"><span className="font-medium">Public Image:</span> {d.publicImage}</p>}
      {d.description && <p className="col-span-2"><span className="font-medium">Description:</span> {d.description}</p>}
      {d.goals && <p className="col-span-2"><span className="font-medium">Goals:</span> {d.goals}</p>}
      {d.secrets && <p className="col-span-2"><span className="font-medium">Secrets:</span> {d.secrets}</p>}
    </div>
  );
}
