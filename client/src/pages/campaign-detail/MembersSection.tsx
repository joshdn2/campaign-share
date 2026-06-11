import type { Campaign, CampaignMember } from "../../types";

/**
 * ============================================================================
 * campaign-detail/MembersSection.tsx
 * ============================================================================
 *
 * Displays the campaign DM and all campaign members. The DM sees controls to
 * add members, toggle member roles between PLAYER and LOREMASTER, and remove
 * members.
 */

interface Props {
  campaign: Campaign;
  isDm: boolean;
  onAddMember: () => void;
  onToggleRole: (userId: string, currentRole: string) => void;
  onRemoveMember: (userId: string) => void;
}

/**
 * MembersSection – renders the campaign member list.
 *
 * The DM row is always shown first with a special badge. Each member row is
 * delegated to `MemberRow` so it can handle its own layout while receiving
 * permission-aware action callbacks.
 */
export function MembersSection({ campaign, isDm, onAddMember, onToggleRole, onRemoveMember }: Props) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      {/* Section header with the add-member trigger (DM only) */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Members</h2>
        {isDm && (
          <button
            onClick={onAddMember}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Add Member
          </button>
        )}
      </div>

      <div className="space-y-2">
        {/* DM row */}
        <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-2 dark:bg-blue-900/20">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-800 dark:text-white">
              {campaign.dm.displayName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{campaign.dm.email}</span>
          </div>
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            DM
          </span>
        </div>

        {/* Member rows */}
        {campaign.members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            isDm={isDm}
            onToggleRole={() => onToggleRole(member.userId, member.role)}
            onRemove={() => onRemoveMember(member.userId)}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * MemberRow – a single campaign member entry.
 *
 * Shows display name, email, role badge, and (when the current user is DM)
 * buttons to toggle role and remove the member.
 */
function MemberRow({
  member,
  isDm,
  onToggleRole,
  onRemove,
}: {
  member: CampaignMember;
  isDm: boolean;
  onToggleRole: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-2 dark:border-gray-800">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-800 dark:text-white">
          {member.user.displayName}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{member.user.email}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          {member.role}
        </span>
        {isDm && (
          <>
            <button
              onClick={onToggleRole}
              className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Toggle role"
            >
              Toggle
            </button>
            <button
              onClick={onRemove}
              className="rounded px-2 py-0.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Remove
            </button>
          </>
        )}
      </div>
    </div>
  );
}
