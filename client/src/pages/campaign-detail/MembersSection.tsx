import { useState } from "react";
import type { Campaign, CampaignMember } from "../../types";

/**
 * ============================================================================
 * campaign-detail/MembersSection.tsx
 * ============================================================================
 *
 * Displays the campaign DM and all campaign members. The DM sees controls to
 * add members, change member roles via a dropdown, and remove members. Removing
 * a member requires typing "delete" in a confirmation modal.
 */

interface Props {
  campaign: Campaign;
  isDm: boolean;
  onAddMember: () => void;
  onToggleRole: (userId: string, currentRole: string) => void;
  onRemoveMember: (userId: string) => void;
}

const ROLES = ["PLAYER", "LOREMASTER"] as const;

/**
 * MembersSection – renders the campaign member list.
 *
 * The DM row is always shown first with a special badge. Each member row shows
 * only the player's name and role to stay compact on narrow cards. The DM can
 * enter per-member edit mode to change the role or remove the member.
 */
export function MembersSection({
  campaign,
  isDm,
  onAddMember,
  onToggleRole,
  onRemoveMember,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<CampaignMember | null>(
    null,
  );
  const [confirmText, setConfirmText] = useState("");

  const openDelete = (member: CampaignMember) => {
    setMemberToDelete(member);
    setConfirmText("");
  };

  const closeDelete = () => {
    setMemberToDelete(null);
    setConfirmText("");
  };

  const confirmDelete = () => {
    if (memberToDelete && confirmText.trim().toLowerCase() === "delete") {
      onRemoveMember(memberToDelete.userId);
      closeDelete();
      setEditingId(null);
    }
  };

  return (
    <section className="rounded-xl border border-transparent bg-accent-subtle p-4 md:p-6">
      {/* Section header with the add-member trigger (DM only) */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">
          Members
        </h2>
        {isDm && (
          <button
            onClick={onAddMember}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-text-on-accent hover:bg-accent-hover"
          >
            + Add Member
          </button>
        )}
      </div>

      <div className="space-y-2">
        {/* DM row */}
        <div className="flex items-center justify-between rounded-lg bg-item-bg px-3 py-2 dark:bg-item-bg">
          <span className="truncate text-sm font-medium text-primary">
            {campaign.dm.displayName}
          </span>
          <span className="shrink-0 rounded bg-accent-subtle px-2 py-0.5 text-xs font-medium text-accent dark:bg-accent-subtle dark:text-accent">
            DM
          </span>
        </div>

        {/* Member rows */}
        {campaign.members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            isDm={isDm}
            isEditing={editingId === member.id}
            onStartEdit={() => setEditingId(member.id)}
            onCancelEdit={() => setEditingId(null)}
            onChangeRole={(newRole) => {
              if (newRole !== member.role) {
                onToggleRole(member.userId, member.role);
              }
            }}
            onDelete={() => openDelete(member)}
          />
        ))}
      </div>

      {/* Delete confirmation modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-card-bg p-5 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-primary">
              Remove member?
            </h3>
            <p className="mb-4 text-sm text-muted dark:text-secondary">
              This will remove{" "}
              <span className="font-medium text-primary">
                {memberToDelete.user.displayName}
              </span>{" "}
              from the campaign. This cannot be undone.
            </p>
            <label className="mb-4 block text-sm text-primary dark:text-secondary">
              Type <span className="font-semibold">delete</span> to confirm:
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="mt-1 w-full rounded-lg border border-default px-3 py-2 text-sm focus:border-danger focus:outline-none dark:border-default dark:bg-surface dark:text-primary"
                autoFocus
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeDelete}
                className="rounded-lg px-4 py-2 text-sm font-medium text-primary hover:bg-surface dark:text-secondary dark:hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={confirmText.trim().toLowerCase() !== "delete"}
                className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-text-on-accent hover:bg-danger-hover disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * MemberRow – a single campaign member entry.
 *
 * In read mode shows the display name, role badge, and an Edit button for the
 * DM. In edit mode the role becomes a dropdown and a trash icon is shown to
 * initiate removal.
 */
function MemberRow({
  member,
  isDm,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onChangeRole,
  onDelete,
}: {
  member: CampaignMember;
  isDm: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onChangeRole: (role: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-transparent bg-item-bg px-3 py-2">
      <span className="truncate text-sm font-medium text-primary">
        {member.user.displayName}
      </span>

      <div className="flex shrink-0 items-center gap-2">
        {isEditing ? (
          <>
            <select
              value={member.role}
              onChange={(e) => onChangeRole(e.target.value)}
              className="rounded-md border border-default bg-elevated px-2 py-1 text-xs text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-default dark:bg-surface dark:text-secondary"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button
              onClick={onDelete}
              className="rounded-md px-2 py-1 text-sm text-danger hover:bg-danger-subtle dark:hover:bg-danger-subtle"
              title="Remove member"
            >
              🗑
            </button>
            <button
              onClick={onCancelEdit}
              className="rounded-md px-2 py-1 text-xs text-muted hover:bg-surface dark:hover:bg-surface"
            >
              Done
            </button>
          </>
        ) : (
          <>
            <span className="rounded bg-surface px-2 py-0.5 text-xs font-medium text-muted dark:bg-surface dark:text-secondary">
              {member.role}
            </span>
            {isDm && (
              <button
                onClick={onStartEdit}
                className="rounded-md px-2 py-1 text-xs text-muted hover:bg-surface dark:text-secondary dark:hover:bg-surface"
              >
                Edit
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
