import { useState } from "react";
import type { Campaign } from "../../types";

/**
 * ============================================================================
 * campaign-detail/CampaignInfoSection.tsx
 * ============================================================================
 *
 * Renders the campaign name and description. The DM can toggle inline editing
 * to update both fields; other users see a read-only view.
 */

interface Props {
  campaign: Campaign;
  isDm: boolean;
  onUpdate: (data: { name: string; description: string }) => Promise<void>;
  isUpdating: boolean;
}

/**
 * CampaignInfoSection – displays and edits the campaign's basic info.
 *
 * State:
 *  - editing: toggles between read-only and edit mode
 *  - name / description: controlled inputs seeded from the campaign prop
 */
export function CampaignInfoSection({ campaign, isDm, onUpdate, isUpdating }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(campaign.name);
  const [description, setDescription] = useState(campaign.description || "");

  /** Enters edit mode and resets inputs to the current campaign values. */
  const startEditing = () => {
    setName(campaign.name);
    setDescription(campaign.description || "");
    setEditing(true);
  };

  /** Persists the updated name and description, then exits edit mode. */
  const save = async () => {
    await onUpdate({ name, description });
    setEditing(false);
  };

  return (
    <section className="rounded-xl border border-transparent bg-accent-subtle p-4 md:p-6">
      {editing ? (
        // Inline edit form
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-default px-3 py-2 text-xl font-bold focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-default dark:bg-surface dark:text-primary"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-default px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-default dark:bg-surface dark:text-primary"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={isUpdating}
              className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-text-on-accent hover:bg-accent-hover disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg px-4 py-1.5 text-sm font-medium text-primary hover:bg-surface dark:text-secondary dark:hover:bg-surface"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // Read-only view
        <div>
          <div className="mb-2 flex items-start justify-between">
            <h1 className="text-2xl font-bold text-primary">{campaign.name}</h1>
            {isDm && (
              <button
                onClick={startEditing}
                className="rounded-md px-3 py-1 text-sm text-muted hover:bg-surface dark:text-secondary dark:hover:bg-surface"
              >
                Edit
              </button>
            )}
          </div>
          {campaign.description && (
            <p className="text-muted dark:text-secondary">{campaign.description}</p>
          )}
        </div>
      )}
    </section>
  );
}
