import { useState } from "react";

/**
 * ============================================================================
 * campaign-detail/AddMemberModal.tsx
 * ============================================================================
 *
 * Modal dialog for inviting a user to the campaign by email address.
 *
 * Props:
 *  - onAdd: async callback that receives `{ email, role }` and persists the
 *           invitation.
 *  - onClose: callback to dismiss the modal.
 *  - isPending: whether the add-member mutation is in flight.
 */

interface Props {
  onAdd: (data: { email: string; role: "PLAYER" | "LOREMASTER" }) => Promise<void>;
  onClose: () => void;
  isPending: boolean;
}

/**
 * AddMemberModal – form for adding a new campaign member.
 *
 * State:
 *  - email: the invitee's email address
 *  - role: campaign role, either PLAYER (default) or LOREMASTER
 */
export function AddMemberModal({ onAdd, onClose, isPending }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"PLAYER" | "LOREMASTER">("PLAYER");

  /**
   * Submits the form, calls `onAdd`, and resets the local form state.
   * The parent is responsible for actually closing the modal on success.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAdd({ email, role });
    onClose();
    setEmail("");
    setRole("PLAYER");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-card-bg p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-primary">Add Member</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-primary dark:text-secondary">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-default px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-default dark:bg-surface dark:text-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-primary dark:text-secondary">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "PLAYER" | "LOREMASTER")}
              className="w-full rounded-lg border border-default px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-default dark:bg-surface dark:text-primary"
            >
              <option value="PLAYER">Player</option>
              <option value="LOREMASTER">Loremaster</option>
            </select>
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
              {isPending ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
