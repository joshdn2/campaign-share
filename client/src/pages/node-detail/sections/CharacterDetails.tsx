import { useState } from "react";
import type { Node } from "../../../types";
import { useUpdateNode } from "../../../hooks/useNodes";
import type { DetailSectionProps } from "../NodeDetailsAndLinks";
import { TextInput, TextArea, CheckboxField } from "./DetailFields";

/**
 * ============================================================================
 * node-detail/sections/CharacterDetails.tsx
 * ============================================================================
 *
 * Detail section for CHARACTER nodes. Displays character fields such as race,
 * class, level, alignment, and descriptive text in a responsive two-column grid.
 * Users with permission can toggle edit mode to update the fields.
 */

type CharacterForm = {
  race: string;
  class: string;
  level: string;
  alignment: string;
  gender: string;
  age: string;
  isPC: boolean;
  physicalDescription: string;
  personality: string;
  goals: string;
  secrets: string;
  abilities: string;
  voice: string;
  mannerisms: string;
};

function emptyForm(): CharacterForm {
  return {
    race: "",
    class: "",
    level: "",
    alignment: "",
    gender: "",
    age: "",
    isPC: false,
    physicalDescription: "",
    personality: "",
    goals: "",
    secrets: "",
    abilities: "",
    voice: "",
    mannerisms: "",
  };
}

function toForm(d: NonNullable<Node["characterDetail"]>): CharacterForm {
  return {
    race: d.race ?? "",
    class: d.class ?? "",
    level: d.level?.toString() ?? "",
    alignment: d.alignment ?? "",
    gender: d.gender ?? "",
    age: d.age ?? "",
    isPC: d.isPC,
    physicalDescription: d.physicalDescription ?? "",
    personality: d.personality ?? "",
    goals: d.goals ?? "",
    secrets: d.secrets ?? "",
    abilities: d.abilities ?? "",
    voice: d.voice ?? "",
    mannerisms: d.mannerisms ?? "",
  };
}

export function CharacterDetails({ node, isEditing, onDone }: DetailSectionProps) {
  const updateNode = useUpdateNode(node.id);
  const [form, setForm] = useState<CharacterForm>(() =>
    node.characterDetail ? toForm(node.characterDetail) : emptyForm(),
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateNode.mutateAsync({
      details: {
        race: form.race || null,
        class: form.class || null,
        level: form.level ? Number(form.level) : null,
        alignment: form.alignment || null,
        gender: form.gender || null,
        age: form.age || null,
        isPC: form.isPC,
        physicalDescription: form.physicalDescription || null,
        personality: form.personality || null,
        goals: form.goals || null,
        secrets: form.secrets || null,
        abilities: form.abilities || null,
        voice: form.voice || null,
        mannerisms: form.mannerisms || null,
      },
    });
    onDone();
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4 text-sm text-muted dark:text-secondary sm:grid-cols-2">
          <TextInput label="Race" value={form.race} onChange={(v) => setForm((f) => ({ ...f, race: v }))} />
          <TextInput label="Class" value={form.class} onChange={(v) => setForm((f) => ({ ...f, class: v }))} />
          <TextInput
            label="Level"
            type="number"
            value={form.level}
            onChange={(v) => setForm((f) => ({ ...f, level: v }))}
          />
          <TextInput label="Alignment" value={form.alignment} onChange={(v) => setForm((f) => ({ ...f, alignment: v }))} />
          <TextInput label="Gender" value={form.gender} onChange={(v) => setForm((f) => ({ ...f, gender: v }))} />
          <TextInput label="Age" value={form.age} onChange={(v) => setForm((f) => ({ ...f, age: v }))} />
          <CheckboxField label="Player Character" checked={form.isPC} onChange={(v) => setForm((f) => ({ ...f, isPC: v }))} />
          <TextArea label="Physical Description" value={form.physicalDescription} onChange={(v) => setForm((f) => ({ ...f, physicalDescription: v }))} />
          <TextArea label="Personality" value={form.personality} onChange={(v) => setForm((f) => ({ ...f, personality: v }))} />
          <TextArea label="Goals" value={form.goals} onChange={(v) => setForm((f) => ({ ...f, goals: v }))} />
          <TextArea label="Secrets" value={form.secrets} onChange={(v) => setForm((f) => ({ ...f, secrets: v }))} />
          <TextArea label="Abilities" value={form.abilities} onChange={(v) => setForm((f) => ({ ...f, abilities: v }))} />
          <TextArea label="Voice" value={form.voice} onChange={(v) => setForm((f) => ({ ...f, voice: v }))} />
          <TextArea label="Mannerisms" value={form.mannerisms} onChange={(v) => setForm((f) => ({ ...f, mannerisms: v }))} />
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

  if (!node.characterDetail) return null;

  const d = node.characterDetail;

  return (
    <div className="grid gap-2 text-sm text-muted dark:text-secondary sm:grid-cols-2">
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
