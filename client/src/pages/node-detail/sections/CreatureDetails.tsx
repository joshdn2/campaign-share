import { useState } from "react";
import type { Node } from "../../../types";
import { useUpdateNode } from "../../../hooks/useNodes";
import type { DetailSectionProps } from "../NodeDetailsAndLinks";
import { TextInput, TextArea } from "./DetailFields";

/**
 * ============================================================================
 * node-detail/sections/CreatureDetails.tsx
 * ============================================================================
 *
 * Detail section for CREATURE nodes. Displays creature fields such as species,
 * size, challenge rating, habitat, and abilities. Users with permission can
 * toggle edit mode to update the fields.
 */

type CreatureForm = {
  species: string;
  size: string;
  challengeRating: string;
  habitat: string;
  abilities: string;
};

function emptyForm(): CreatureForm {
  return { species: "", size: "", challengeRating: "", habitat: "", abilities: "" };
}

function toForm(d: NonNullable<Node["creatureDetail"]>): CreatureForm {
  return {
    species: d.species ?? "",
    size: d.size ?? "",
    challengeRating: d.challengeRating ?? "",
    habitat: d.habitat ?? "",
    abilities: d.abilities ?? "",
  };
}

export function CreatureDetails({ node, isEditing, onDone }: DetailSectionProps) {
  const updateNode = useUpdateNode(node.id);
  const [form, setForm] = useState<CreatureForm>(() =>
    node.creatureDetail ? toForm(node.creatureDetail) : emptyForm(),
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateNode.mutateAsync({
      details: {
        species: form.species || null,
        size: form.size || null,
        challengeRating: form.challengeRating || null,
        habitat: form.habitat || null,
        abilities: form.abilities || null,
      },
    });
    onDone();
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4 text-sm text-muted dark:text-secondary sm:grid-cols-2">
          <TextInput label="Species" value={form.species} onChange={(v) => setForm((f) => ({ ...f, species: v }))} />
          <TextInput label="Size" value={form.size} onChange={(v) => setForm((f) => ({ ...f, size: v }))} />
          <TextInput label="CR" value={form.challengeRating} onChange={(v) => setForm((f) => ({ ...f, challengeRating: v }))} />
          <TextInput label="Habitat" value={form.habitat} onChange={(v) => setForm((f) => ({ ...f, habitat: v }))} />
          <TextArea label="Abilities" value={form.abilities} onChange={(v) => setForm((f) => ({ ...f, abilities: v }))} />
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
