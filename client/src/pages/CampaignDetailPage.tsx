import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  useCampaign,
  useUpdateCampaign,
  useAddMember,
  useRemoveMember,
  useUpdateMemberRole,
} from "../hooks/useCampaigns";
import { useCampaignNodes, useCreateNode } from "../hooks/useNodes";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { useAuthStore } from "../stores/authStore";
import type { NodeType } from "../types";

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  ARC: "Arc",
  SESSION: "Session",
  CHARACTER: "Character",
  CREATURE: "Creature",
  ITEM: "Item",
  LOCATION: "Location",
  NOTE: "Note",
};

export function CampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterType = searchParams.get("type") as NodeType | null;
  const { user } = useAuthStore();
  const {
    data: campaign,
    isLoading: campaignLoading,
    error: campaignError,
  } = useCampaign(campaignId!);
  const { data: nodes, isLoading: nodesLoading } = useCampaignNodes(
    campaignId!,
  );
  const updateCampaign = useUpdateCampaign(campaignId!);
  const addMember = useAddMember(campaignId!);
  const removeMember = useRemoveMember(campaignId!);
  const updateMemberRole = useUpdateMemberRole(campaignId!);
  const createNode = useCreateNode(campaignId!);

  const [editingInfo, setEditingInfo] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"PLAYER" | "LOREMASTER">(
    "PLAYER",
  );

  const [showCreateNode, setShowCreateNode] = useState(false);
  const [createNodeType, setCreateNodeType] = useState<NodeType | null>(null);
  const [pendingParentId, setPendingParentId] = useState<string | null>(null);

  // Auto-open create modal if ?create=1 is present
  useEffect(() => {
    if (searchParams.get("create") === "1" && filterType) {
      setCreateNodeType(filterType);
      setShowCreateNode(true);
      // Clear the create param without refreshing
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("create");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, filterType, setSearchParams]);
  const [createNodeTitle, setCreateNodeTitle] = useState("");
  const [createNodeExcerpt, setCreateNodeExcerpt] = useState("");

  const isDm = campaign?.dmId === user?.id;

  if (campaignLoading || nodesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (campaignError || !campaign) {
    return (
      <ErrorMessage message={campaignError?.message || "Campaign not found"} />
    );
  }

  const startEditing = () => {
    setEditName(campaign.name);
    setEditDescription(campaign.description || "");
    setEditingInfo(true);
  };

  const saveCampaign = async () => {
    await updateCampaign.mutateAsync({
      name: editName,
      description: editDescription,
    });
    setEditingInfo(false);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    await addMember.mutateAsync({ email: memberEmail, role: memberRole });
    setShowAddMember(false);
    setMemberEmail("");
    setMemberRole("PLAYER");
  };

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createNodeType) return;
    const node = await createNode.mutateAsync({
      type: createNodeType,
      title: createNodeTitle,
      excerpt: createNodeExcerpt,
      parentId: pendingParentId || undefined,
    });
    setShowCreateNode(false);
    setCreateNodeType(null);
    setCreateNodeTitle("");
    setCreateNodeExcerpt("");
    setPendingParentId(null);
    navigate(`/campaigns/${campaignId}/nodes/${node.id}`);
  };

  const nodesByType = nodes?.reduce(
    (acc, node) => {
      acc[node.type] = acc[node.type] || [];
      acc[node.type].push(node);
      return acc;
    },
    {} as Record<NodeType, typeof nodes>,
  );

  const filteredNodes = filterType
    ? nodes
        ?.filter((n) => n.type === filterType)
        .sort((a, b) => {
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        })
    : null;

  const arcs = nodesByType?.ARC || [];
  const sessions = nodesByType?.SESSION || [];
  const arcSessions = (arcId: string) =>
    sessions.filter((s) => s.parentId === arcId);

  return (
    <div className="space-y-8">
      {/* Filtered Node List */}
      {filterType && filteredNodes && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {NODE_TYPE_LABELS[filterType]}s
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCreateNodeType(filterType);
                  setShowCreateNode(true);
                }}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                + Create {NODE_TYPE_LABELS[filterType]}
              </button>
              <button
                onClick={() => setSearchParams({})}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Back
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {filteredNodes.map((node) => (
              <button
                key={node.id}
                onClick={() =>
                  navigate(`/campaigns/${campaignId}/nodes/${node.id}`)
                }
                className="flex w-full items-center justify-between rounded-lg border border-gray-100 p-3 text-left hover:border-blue-200 hover:bg-blue-50 dark:border-gray-800 dark:hover:border-blue-900 dark:hover:bg-blue-900/10"
              >
                <div>
                  <span className="font-medium text-gray-800 dark:text-white">
                    {node.title}
                  </span>
                  {node.excerpt && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                      {node.excerpt}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(node.updatedAt).toLocaleDateString()}
                </span>
              </button>
            ))}
            {filteredNodes.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No {NODE_TYPE_LABELS[filterType].toLowerCase()}s found.
              </p>
            )}
          </div>
        </section>
      )}

      {!filterType && (
        <>
          {/* Campaign Info */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            {editingInfo ? (
              <div className="space-y-3">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xl font-bold focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveCampaign}
                    disabled={updateCampaign.isPending}
                    className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingInfo(false)}
                    className="rounded-lg px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-2 flex items-start justify-between">
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {campaign.name}
                  </h1>
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
                  <p className="text-gray-600 dark:text-gray-400">
                    {campaign.description}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Members */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Members
              </h2>
              {isDm && (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  + Add Member
                </button>
              )}
            </div>

            <div className="space-y-2">
              {/* DM */}
              <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-2 dark:bg-blue-900/20">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-800 dark:text-white">
                    {campaign.dm.displayName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {campaign.dm.email}
                  </span>
                </div>
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  DM
                </span>
              </div>

              {/* Members */}
              {campaign.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-2 dark:border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      {member.user.displayName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {member.user.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      {member.role}
                    </span>
                    {isDm && (
                      <>
                        <button
                          onClick={() =>
                            updateMemberRole.mutate({
                              userId: member.userId,
                              role:
                                member.role === "PLAYER"
                                  ? "LOREMASTER"
                                  : "PLAYER",
                            })
                          }
                          className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Toggle role"
                        >
                          Toggle
                        </button>
                        <button
                          onClick={() => removeMember.mutate(member.userId)}
                          className="rounded px-2 py-0.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Arcs & Sessions */}
          {arcs.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
                Arcs
              </h2>
              <div className="space-y-4">
                {arcs.map((arc) => (
                  <div
                    key={arc.id}
                    className="rounded-lg border border-gray-100 p-4 dark:border-gray-800"
                  >
                    <button
                      onClick={() =>
                        navigate(`/campaigns/${campaignId}/nodes/${arc.id}`)
                      }
                      className="text-left"
                    >
                      <h3 className="font-semibold text-gray-800 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                        {arc.title}
                      </h3>
                      {arc.excerpt && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {arc.excerpt}
                        </p>
                      )}
                    </button>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setCreateNodeType("SESSION");
                          setCreateNodeTitle("");
                          setCreateNodeExcerpt("");
                          // We'll pass parentId when creating
                          setShowCreateNode(true);
                          // Store the arc id in a temp state for the modal
                          setPendingParentId(arc.id);
                        }}
                        className="rounded px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      >
                        + Session
                      </button>
                    </div>
                    {arcSessions(arc.id).length > 0 && (
                      <div className="mt-3 space-y-1 pl-4">
                        {arcSessions(arc.id).map((session) => (
                          <button
                            key={session.id}
                            onClick={() =>
                              navigate(
                                `/campaigns/${campaignId}/nodes/${session.id}`,
                              )
                            }
                            className="block text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                          >
                            └ {session.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Other Nodes by Type */}
          {(
            ["CHARACTER", "LOCATION", "ITEM", "CREATURE", "NOTE"] as NodeType[]
          ).map((type) => {
            const typeNodes = nodesByType?.[type] || [];
            if (typeNodes.length === 0) return null;
            return (
              <section
                key={type}
                className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
              >
                <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
                  {NODE_TYPE_LABELS[type]}s
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {typeNodes.map((node) => (
                    <button
                      key={node.id}
                      onClick={() =>
                        navigate(`/campaigns/${campaignId}/nodes/${node.id}`)
                      }
                      className="rounded-lg border border-gray-100 p-3 text-left hover:border-blue-200 hover:bg-blue-50 dark:border-gray-800 dark:hover:border-blue-900 dark:hover:bg-blue-900/10"
                    >
                      <span className="font-medium text-gray-800 dark:text-white">
                        {node.title}
                      </span>
                      {node.excerpt && (
                        <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                          {node.excerpt}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">
              Add Member
            </h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role
                </label>
                <select
                  value={memberRole}
                  onChange={(e) =>
                    setMemberRole(e.target.value as "PLAYER" | "LOREMASTER")
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="PLAYER">Player</option>
                  <option value="LOREMASTER">Loremaster</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMember.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {addMember.isPending ? "Adding..." : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Node Modal */}
      {showCreateNode && createNodeType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">
              New {NODE_TYPE_LABELS[createNodeType]}
            </h2>
            <form onSubmit={handleCreateNode} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title
                </label>
                <input
                  type="text"
                  value={createNodeTitle}
                  onChange={(e) => setCreateNodeTitle(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Excerpt
                </label>
                <textarea
                  value={createNodeExcerpt}
                  onChange={(e) => setCreateNodeExcerpt(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateNode(false);
                    setCreateNodeType(null);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createNode.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {createNode.isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
