import { useState } from "react";
import { ErrorMessage } from "../../components/ui/ErrorMessage";

/**
 * ============================================================================
 * campaign-detail/AddMemberModal.tsx
 * ============================================================================
 *
 * Modal dialog for inviting an existing user to the campaign by email address
 * or username (display name).
 *
 * Props:
 *  - onAdd: async callback that receives `{ identifier, identifierType, role }`
 *           and persists the invitation.
 *  - onClose: callback to dismiss the modal.
 *  - isPending: whether the add-member mutation is in flight.
 */

type IdentifierType = "email" | "username";

interface Props {
  onAdd: (data: {
    identifier: string;
    identifierType: IdentifierType;
    role: "PLAYER" | "LOREMASTER";
  }) => Promise<void>;
  onClose: () => void;
  isPending: boolean;
}

/**
 * AddMemberModal – form for adding an existing user to a campaign.
 *
 * State:
 *  - identifierType: whether the user is being looked up by email or username
 *  - identifier: the invitee's email address or username
 *  - role: campaign role, either PLAYER (default) or LOREMASTER
 *  - error: local error message if the add fails
 */
export function AddMemberModal({ onAdd, onClose, isPending }: Props) {
  const [identifierType, setIdentifierType] =
    useState<IdentifierType>("email");
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState<"PLAYER" | "LOREMASTER">("PLAYER");
  const [error, setError] = useState<string | null>(null);

  /**
   * Submits the form, calls `onAdd`, and resets the local form state on success.
   * The modal stays open if the add fails so the user can see the error.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onAdd({ identifier: identifier.trim(), identifierType, role });
      setIdentifier("");
      setRole("PLAYER");
      onClose();
    } catch (err) {
      setError(getAddMemberErrorMessage(err));
    }
  };

  const inputType = identifierType === "email" ? "email" : "text";
  const inputLabel = identifierType === "email" ? "Email" : "Username";
  const inputPlaceholder =
    identifierType === "email" ? "user@example.com" : "their username";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-elevated p-6 shadow-xl">
        <h2 className="mb-2 text-lg font-bold text-primary">Add Member</h2>
        <p className="mb-4 text-sm text-muted">
          Only users who already have an account can be added. Invite them by
          their email address or username.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-primary dark:text-secondary">
              Look up by
            </label>
            <select
              value={identifierType}
              onChange={(e) => {
                setIdentifierType(e.target.value as IdentifierType);
                setIdentifier("");
                setError(null);
              }}
              className="w-full rounded-lg border border-default px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-default dark:bg-surface dark:text-primary"
            >
              <option value="email">Email</option>
              <option value="username">Username</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-primary dark:text-secondary">
              {inputLabel}
            </label>
            <input
              type={inputType}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={inputPlaceholder}
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

          {error && <ErrorMessage message={error} />}

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

function getAddMemberErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as { response?: { data?: { error?: unknown } } }).response
      ?.data;
    if (data?.error) {
      if (typeof data.error === "string") return data.error;
      return JSON.stringify(data.error);
    }
  }
  if (error instanceof Error) return error.message;
  return "Failed to add member. Please try again.";
}
