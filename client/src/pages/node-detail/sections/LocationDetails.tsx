import { useState } from "react";
import type { Node, LocationType } from "../../../types";
import { useUpdateNode } from "../../../hooks/useNodes";
import type { DetailSectionProps } from "../NodeDetailsAndLinks";
import { TextInput } from "./DetailFields";

/**
 * ============================================================================
 * node-detail/sections/LocationDetails.tsx
 * ============================================================================
 *
 * Detail section for LOCATION nodes. Displays location fields such as type,
 * region, climate, and population. Users with permission can toggle edit mode
 * to update the fields.
 */

const LOCATION_TYPES: LocationType[] = [
  "REGION",
  "CITY",
  "TOWN",
  "DUNGEON",
  "BUILDING",
  "WILDERNESS",
  "POINT_OF_INTEREST",
];

type LocationForm = {
  locationType: LocationType;
  region: string;
  climate: string;
  population: string;
};

function emptyForm(): LocationForm {
  return { locationType: "POINT_OF_INTEREST", region: "", climate: "", population: "" };
}

function toForm(d: NonNullable<Node["locationDetail"]>): LocationForm {
  return {
    locationType: d.locationType ?? "POINT_OF_INTEREST",
    region: d.region ?? "",
    climate: d.climate ?? "",
    population: d.population ?? "",
  };
}

export function LocationDetails({ node, isEditing, onDone }: DetailSectionProps) {
  const updateNode = useUpdateNode(node.id);
  const [form, setForm] = useState<LocationForm>(() =>
    node.locationDetail ? toForm(node.locationDetail) : emptyForm(),
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateNode.mutateAsync({
      details: {
        locationType: form.locationType,
        region: form.region || null,
        climate: form.climate || null,
        population: form.population || null,
      },
    });
    onDone();
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4 text-sm text-muted dark:text-secondary sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-primary dark:text-secondary">Type</label>
            <select
              value={form.locationType}
              onChange={(e) => setForm((f) => ({ ...f, locationType: e.target.value as LocationType }))}
              className="w-full rounded-lg border border-default px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-default dark:bg-surface dark:text-primary"
            >
              {LOCATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <TextInput label="Region" value={form.region} onChange={(v) => setForm((f) => ({ ...f, region: v }))} />
          <TextInput label="Climate" value={form.climate} onChange={(v) => setForm((f) => ({ ...f, climate: v }))} />
          <TextInput label="Population" value={form.population} onChange={(v) => setForm((f) => ({ ...f, population: v }))} />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={updateNode.isPending}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-text-on-accent hover:bg-accent-hover disabled:opacity-50"
          >
            {updateNode.isPending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={onDone}
            disabled={updateNode.isPending}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-surface dark:text-secondary dark:hover:bg-surface"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  if (!node.locationDetail) return null;

  const d = node.locationDetail;

  return (
    <div className="grid gap-2 text-sm text-muted dark:text-secondary sm:grid-cols-2">
      {d.locationType && <p><span className="font-medium">Type:</span> {d.locationType.replace(/_/g, " ")}</p>}
      {d.region && <p><span className="font-medium">Region:</span> {d.region}</p>}
      {d.climate && <p><span className="font-medium">Climate:</span> {d.climate}</p>}
      {d.population && <p><span className="font-medium">Population:</span> {d.population}</p>}
    </div>
  );
}
