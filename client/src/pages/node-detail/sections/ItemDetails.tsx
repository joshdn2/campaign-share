import { useState } from "react";
import type { Node } from "../../../types";
import { useUpdateNode } from "../../../hooks/useNodes";
import type { DetailSectionProps } from "../NodeDetailsAndLinks";
import { TextInput, TextArea, CheckboxField } from "./DetailFields";

/**
 * ============================================================================
 * node-detail/sections/ItemDetails.tsx
 * ============================================================================
 *
 * Detail section for ITEM nodes. Displays item fields such as type, rarity,
 * value, weight, attunement requirement, and abilities. Users with permission
 * can toggle edit mode to update the fields.
 */

type ItemForm = {
  itemType: string;
  rarity: string;
  value: string;
  weight: string;
  requiresAttunement: boolean;
  abilities: string;
};

function emptyForm(): ItemForm {
  return { itemType: "", rarity: "", value: "", weight: "", requiresAttunement: false, abilities: "" };
}

function toForm(d: NonNullable<Node["itemDetail"]>): ItemForm {
  return {
    itemType: d.itemType ?? "",
    rarity: d.rarity ?? "",
    value: d.value ?? "",
    weight: d.weight ?? "",
    requiresAttunement: d.requiresAttunement,
    abilities: d.abilities ?? "",
  };
}

export function ItemDetails({ node, isEditing, onDone }: DetailSectionProps) {
  const updateNode = useUpdateNode(node.id);
  const [form, setForm] = useState<ItemForm>(() =>
    node.itemDetail ? toForm(node.itemDetail) : emptyForm(),
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateNode.mutateAsync({
      details: {
        itemType: form.itemType || null,
        rarity: form.rarity || null,
        value: form.value || null,
        weight: form.weight || null,
        requiresAttunement: form.requiresAttunement,
        abilities: form.abilities || null,
      },
    });
    onDone();
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4 text-sm text-muted dark:text-secondary sm:grid-cols-2">
          <TextInput label="Type" value={form.itemType} onChange={(v) => setForm((f) => ({ ...f, itemType: v }))} />
          <TextInput label="Rarity" value={form.rarity} onChange={(v) => setForm((f) => ({ ...f, rarity: v }))} />
          <TextInput label="Value" value={form.value} onChange={(v) => setForm((f) => ({ ...f, value: v }))} />
          <TextInput label="Weight" value={form.weight} onChange={(v) => setForm((f) => ({ ...f, weight: v }))} />
          <CheckboxField
            label="Requires Attunement"
            checked={form.requiresAttunement}
            onChange={(v) => setForm((f) => ({ ...f, requiresAttunement: v }))}
          />
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

  if (!node.itemDetail) return null;

  const d = node.itemDetail;

  return (
    <div className="grid gap-2 text-sm text-muted dark:text-secondary sm:grid-cols-2">
      {d.itemType && <p><span className="font-medium">Type:</span> {d.itemType}</p>}
      {d.rarity && <p><span className="font-medium">Rarity:</span> {d.rarity}</p>}
      {d.value && <p><span className="font-medium">Value:</span> {d.value}</p>}
      {d.weight && <p><span className="font-medium">Weight:</span> {d.weight}</p>}
      <p><span className="font-medium">Attunement:</span> {d.requiresAttunement ? "Required" : "Not required"}</p>
      {d.abilities && <p className="col-span-2"><span className="font-medium">Abilities:</span> {d.abilities}</p>}
    </div>
  );
}
