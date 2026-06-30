import { useState } from "react";

/**
 * ============================================================================
 * campaigns-list/CreateCampaignModal.tsx
 * ============================================================================
 *
 * Modal dialog for creating a new campaign. Collects a required name and an
 * optional description.
 */

interface Props {
  onCreate: (data: { name: string; description?: string }) => Promise<void>;
  onClose: () => void;
  isPending: boolean;
}

/**
 * CreateCampaignModal – form for creating a new campaign.
 *
 * State:
 *  - name: required campaign name
 *  - description: optional longer description
 */
export function CreateCampaignModal({ onCreate, onClose, isPending }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  /** Submits the form, creates the campaign, and resets local form state. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreate({ name, description });
    onClose();
    setName("");
    setDescription("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-elevated p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-primary">Create Campaign</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-primary dark:text-secondary">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-default px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-default dark:bg-surface dark:text-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-primary dark:text-secondary">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-default px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-default dark:bg-surface dark:text-primary"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-primary hover:bg-surface dark:text-secondary dark:hover:bg-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-text-on-accent hover:bg-accent-hover disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
