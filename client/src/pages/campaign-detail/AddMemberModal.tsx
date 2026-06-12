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
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">Add Member</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "PLAYER" | "LOREMASTER")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="PLAYER">Player</option>
              <option value="LOREMASTER">Loremaster</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
