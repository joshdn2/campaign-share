import { useState } from "react";
import type { Campaign } from "../../types";

// Renders campaign name + description. DM can edit inline.
interface Props {
  campaign: Campaign;
  isDm: boolean;
  onUpdate: (data: { name: string; description: string }) => Promise<void>;
  isUpdating: boolean;
}

export function CampaignInfoSection({ campaign, isDm, onUpdate, isUpdating }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(campaign.name);
  const [description, setDescription] = useState(campaign.description || "");

  const startEditing = () => {
    setName(campaign.name);
    setDescription(campaign.description || "");
    setEditing(true);
  };

  const save = async () => {
    await onUpdate({ name, description });
    setEditing(false);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      {editing ? (
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xl font-bold focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={isUpdating}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-2 flex items-start justify-between">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{campaign.name}</h1>
            {isDm && (
              <button
                onClick={startEditing}
                className="rounded-md px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Edit
              </button>
            )}
          </div>
          {campaign.description && (
            <p className="text-gray-600 dark:text-gray-400">{campaign.description}</p>
          )}
        </div>
      )}
    </section>
  );
}
