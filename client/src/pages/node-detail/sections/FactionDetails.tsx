import { useState } from "react";
import type { Node } from "../../../types";
import { useUpdateNode } from "../../../hooks/useNodes";
import type { DetailSectionProps } from "../NodeDetailsAndLinks";
import { TextInput, TextArea } from "./DetailFields";

/**
 * ============================================================================
 * node-detail/sections/FactionDetails.tsx
 * ============================================================================
 *
 * Detail section for FACTION nodes. Displays faction fields such as type,
 * alignment, size, reach, influence level, leader, headquarters, and descriptive
 * text in a responsive two-column grid. Users with permission can toggle edit
 * mode to update the fields.
 */

type FactionForm = {
  factionType: string;
  description: string;
  alignment: string;
  size: string;
  reach: string;
  goals: string;
  secrets: string;
  resources: string;
  publicImage: string;
  leaderName: string;
  headquarters: string;
  influenceLevel: string;
};

function emptyForm(): FactionForm {
  return {
    factionType: "",
    description: "",
    alignment: "",
    size: "",
    reach: "",
    goals: "",
    secrets: "",
    resources: "",
    publicImage: "",
    leaderName: "",
    headquarters: "",
    influenceLevel: "",
  };
}

function toForm(d: NonNullable<Node["factionDetail"]>): FactionForm {
  return {
    factionType: d.factionType ?? "",
    description: d.description ?? "",
    alignment: d.alignment ?? "",
    size: d.size ?? "",
    reach: d.reach ?? "",
    goals: d.goals ?? "",
    secrets: d.secrets ?? "",
    resources: d.resources ?? "",
    publicImage: d.publicImage ?? "",
    leaderName: d.leaderName ?? "",
    headquarters: d.headquarters ?? "",
    influenceLevel: d.influenceLevel ?? "",
  };
}

export function FactionDetails({ node, isEditing, onDone }: DetailSectionProps) {
  const updateNode = useUpdateNode(node.id);
  const [form, setForm] = useState<FactionForm>(() =>
    node.factionDetail ? toForm(node.factionDetail) : emptyForm(),
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateNode.mutateAsync({
      details: {
        factionType: form.factionType || null,
        description: form.description || null,
        alignment: form.alignment || null,
        size: form.size || null,
        reach: form.reach || null,
        goals: form.goals || null,
        secrets: form.secrets || null,
        resources: form.resources || null,
        publicImage: form.publicImage || null,
        leaderName: form.leaderName || null,
        headquarters: form.headquarters || null,
        influenceLevel: form.influenceLevel || null,
      },
    });
    onDone();
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4 text-sm text-muted dark:text-secondary sm:grid-cols-2">
          <TextInput label="Type" value={form.factionType} onChange={(v) => setForm((f) => ({ ...f, factionType: v }))} />
          <TextInput label="Alignment" value={form.alignment} onChange={(v) => setForm((f) => ({ ...f, alignment: v }))} />
          <TextInput label="Size" value={form.size} onChange={(v) => setForm((f) => ({ ...f, size: v }))} />
          <TextInput label="Reach" value={form.reach} onChange={(v) => setForm((f) => ({ ...f, reach: v }))} />
          <TextInput label="Influence Level" value={form.influenceLevel} onChange={(v) => setForm((f) => ({ ...f, influenceLevel: v }))} />
          <TextInput label="Leader" value={form.leaderName} onChange={(v) => setForm((f) => ({ ...f, leaderName: v }))} />
          <TextInput label="Headquarters" value={form.headquarters} onChange={(v) => setForm((f) => ({ ...f, headquarters: v }))} />
          <TextArea label="Resources" value={form.resources} onChange={(v) => setForm((f) => ({ ...f, resources: v }))} />
          <TextArea label="Public Image" value={form.publicImage} onChange={(v) => setForm((f) => ({ ...f, publicImage: v }))} />
          <TextArea label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} />
          <TextArea label="Goals" value={form.goals} onChange={(v) => setForm((f) => ({ ...f, goals: v }))} />
          <TextArea label="Secrets" value={form.secrets} onChange={(v) => setForm((f) => ({ ...f, secrets: v }))} />
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

  if (!node.factionDetail) return null;

  const d = node.factionDetail;

  return (
    <div className="grid gap-2 text-sm text-muted dark:text-secondary sm:grid-cols-2">
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
