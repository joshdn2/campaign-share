import type { Node } from "../../../types";

// Displays location-specific fields.
export function LocationDetails({ node }: { node: Node }) {
  if (!node.locationDetail) return null;
  const d = node.locationDetail;

  return (
    <div className="grid gap-2 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-2">
      {d.locationType && <p><span className="font-medium">Type:</span> {d.locationType}</p>}
      {d.region && <p><span className="font-medium">Region:</span> {d.region}</p>}
      {d.climate && <p><span className="font-medium">Climate:</span> {d.climate}</p>}
      {d.population && <p><span className="font-medium">Population:</span> {d.population}</p>}
    </div>
  );
}
