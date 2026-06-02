import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNode, useUpdateNode, useDeleteNode, useCampaignNodes } from "../hooks/useNodes";
import {
  useNodeBlocks,
  useCreateBlock,
  useUpdateBlock,
  useDeleteBlock,
} from "../hooks/useBlocks";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { useAuthStore } from "../stores/authStore";
import type { Visibility, BlockType } from "../types";

const VISIBILITY_OPTIONS: Visibility[] = ["PRIVATE", "PUBLIC", "DM_ONLY"];
const BLOCK_TYPE_OPTIONS: BlockType[] = ["TEXT", "RICH_TEXT"];

export function NodeDetailPage() {
  const { campaignId, nodeId } = useParams<{ campaignId: string; nodeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: node, isLoading, error } = useNode(nodeId!);
  const { data: campaignNodes } = useCampaignNodes(campaignId!);
  const { data: blocks } = useNodeBlocks(nodeId!);
  const updateNode = useUpdateNode(nodeId!);
  const deleteNode = useDeleteNode();
  const createBlock = useCreateBlock(nodeId!);
  const updateBlock = useUpdateBlock("", nodeId!);
  const deleteBlock = useDeleteBlock("", nodeId!);

  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");

  const [showAddBlock, setShowAddBlock] = useState(false);
  const [newBlockType, setNewBlockType] = useState<BlockType>("TEXT");
  const [newBlockContent, setNewBlockContent] = useState("");
  const [newBlockVisibility, setNewBlockVisibility] = useState<Visibility>("PUBLIC");

  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editBlockContent, setEditBlockContent] = useState("");
  const [editBlockVisibility, setEditBlockVisibility] = useState<Visibility>("PUBLIC");

  const isOwner = node?.ownerId === user?.id;
  const isDm = node?.campaign?.dmId === user?.id;
  const canEdit = isOwner || isDm;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !node) {
    return <ErrorMessage message={error?.message || "Node not found"} />;
  }

  const startEditingTitle = () => {
    setEditTitle(node.title);
    setEditingTitle(true);
  };

  const saveTitle = async () => {
    await updateNode.mutateAsync({ title: editTitle });
    setEditingTitle(false);
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBlock.mutateAsync({
      type: newBlockType,
      content: { text: newBlockContent },
      visibility: newBlockVisibility,
    });
    setShowAddBlock(false);
    setNewBlockContent("");
    setNewBlockVisibility("PUBLIC");
  };

  const startEditingBlock = (blockId: string, content: Record<string, unknown>, visibility: Visibility) => {
    setEditingBlock(blockId);
    setEditBlockContent((content.text as string) || "");
    setEditBlockVisibility(visibility);
  };

  const saveBlock = async (blockId: string) => {
    await updateBlock.mutateAsync({
      content: { text: editBlockContent },
      visibility: editBlockVisibility,
    });
    setEditingBlock(null);
  };

  const handleDeleteNode = async () => {
    if (!confirm("Are you sure you want to delete this node?")) return;
    await deleteNode.mutateAsync({ nodeId: node.id, campaignId: campaignId! });
    navigate(`/campaigns/${campaignId}`);
  };

  const renderDetailFields = () => {
    switch (node.type) {
      case "ARC":
        return node.arcDetail ? (
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p><span className="font-medium">Arc Number:</span> {node.arcDetail.arcNumber}</p>
            {node.arcDetail.description && <p>{node.arcDetail.description}</p>}
          </div>
        ) : null;
      case "SESSION":
        return node.sessionDetail ? (
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p><span className="font-medium">Session Number:</span> {node.sessionDetail.sessionNumber}</p>
            {node.sessionDetail.sessionDate && (
              <p><span className="font-medium">Date:</span> {new Date(node.sessionDetail.sessionDate).toLocaleDateString()}</p>
            )}
            {node.sessionDetail.shortSummary && (
              <p><span className="font-medium">Short Summary:</span> {node.sessionDetail.shortSummary}</p>
            )}
            {node.sessionDetail.longSummary && (
              <p><span className="font-medium">Long Summary:</span> {node.sessionDetail.longSummary}</p>
            )}
          </div>
        ) : null;
      case "CHARACTER":
        return node.characterDetail ? (
          <div className="grid gap-2 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-2">
            {node.characterDetail.race && <p><span className="font-medium">Race:</span> {node.characterDetail.race}</p>}
            {node.characterDetail.class && <p><span className="font-medium">Class:</span> {node.characterDetail.class}</p>}
            {node.characterDetail.level != null && <p><span className="font-medium">Level:</span> {node.characterDetail.level}</p>}
            {node.characterDetail.alignment && <p><span className="font-medium">Alignment:</span> {node.characterDetail.alignment}</p>}
            {node.characterDetail.gender && <p><span className="font-medium">Gender:</span> {node.characterDetail.gender}</p>}
            {node.characterDetail.age && <p><span className="font-medium">Age:</span> {node.characterDetail.age}</p>}
            <p><span className="font-medium">PC:</span> {node.characterDetail.isPC ? "Yes" : "No"}</p>
            {node.characterDetail.physicalDescription && (
              <p className="col-span-2"><span className="font-medium">Description:</span> {node.characterDetail.physicalDescription}</p>
            )}
            {node.characterDetail.personality && (
              <p className="col-span-2"><span className="font-medium">Personality:</span> {node.characterDetail.personality}</p>
            )}
            {node.characterDetail.goals && (
              <p className="col-span-2"><span className="font-medium">Goals:</span> {node.characterDetail.goals}</p>
            )}
            {node.characterDetail.secrets && (
              <p className="col-span-2"><span className="font-medium">Secrets:</span> {node.characterDetail.secrets}</p>
            )}
            {node.characterDetail.abilities && (
              <p className="col-span-2"><span className="font-medium">Abilities:</span> {node.characterDetail.abilities}</p>
            )}
            {node.characterDetail.voice && (
              <p className="col-span-2"><span className="font-medium">Voice:</span> {node.characterDetail.voice}</p>
            )}
            {node.characterDetail.mannerisms && (
              <p className="col-span-2"><span className="font-medium">Mannerisms:</span> {node.characterDetail.mannerisms}</p>
            )}
          </div>
        ) : null;
      case "CREATURE":
        return node.creatureDetail ? (
          <div className="grid gap-2 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-2">
            {node.creatureDetail.species && <p><span className="font-medium">Species:</span> {node.creatureDetail.species}</p>}
            {node.creatureDetail.size && <p><span className="font-medium">Size:</span> {node.creatureDetail.size}</p>}
            {node.creatureDetail.challengeRating && <p><span className="font-medium">CR:</span> {node.creatureDetail.challengeRating}</p>}
            {node.creatureDetail.habitat && <p><span className="font-medium">Habitat:</span> {node.creatureDetail.habitat}</p>}
            {node.creatureDetail.abilities && (
              <p className="col-span-2"><span className="font-medium">Abilities:</span> {node.creatureDetail.abilities}</p>
            )}
          </div>
        ) : null;
      case "ITEM":
        return node.itemDetail ? (
          <div className="grid gap-2 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-2">
            {node.itemDetail.itemType && <p><span className="font-medium">Type:</span> {node.itemDetail.itemType}</p>}
            {node.itemDetail.rarity && <p><span className="font-medium">Rarity:</span> {node.itemDetail.rarity}</p>}
            {node.itemDetail.value && <p><span className="font-medium">Value:</span> {node.itemDetail.value}</p>}
            {node.itemDetail.weight && <p><span className="font-medium">Weight:</span> {node.itemDetail.weight}</p>}
            <p><span className="font-medium">Attunement:</span> {node.itemDetail.requiresAttunement ? "Required" : "Not required"}</p>
            {node.itemDetail.abilities && (
              <p className="col-span-2"><span className="font-medium">Abilities:</span> {node.itemDetail.abilities}</p>
            )}
          </div>
        ) : null;
      case "LOCATION":
        return node.locationDetail ? (
          <div className="grid gap-2 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-2">
            {node.locationDetail.locationType && <p><span className="font-medium">Type:</span> {node.locationDetail.locationType}</p>}
            {node.locationDetail.region && <p><span className="font-medium">Region:</span> {node.locationDetail.region}</p>}
            {node.locationDetail.climate && <p><span className="font-medium">Climate:</span> {node.locationDetail.climate}</p>}
            {node.locationDetail.population && <p><span className="font-medium">Population:</span> {node.locationDetail.population}</p>}
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-2xl font-bold focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button
                onClick={saveTitle}
                disabled={updateNode.isPending}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditingTitle(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{node.title}</h1>
              {canEdit && (
                <button
                  onClick={startEditingTitle}
                  className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  Edit
                </button>
              )}
            </div>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {node.type}
            </span>
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                node.visibility === "PUBLIC"
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : node.visibility === "PRIVATE"
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                  : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
              }`}
            >
              {node.visibility}
            </span>
            {node.excerpt && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{node.excerpt}</p>
            )}
          </div>
        </div>
        {canEdit && (
          <button
            onClick={handleDeleteNode}
            className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            Delete
          </button>
        )}
      </div>

      {/* Details */}
      {renderDetailFields() && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white">Details</h2>
          {renderDetailFields()}
        </section>
      )}

      {/* Parent Selector */}
      {canEdit && campaignNodes && (
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Parent</h3>
          <ParentSelector
            node={node}
            campaignNodes={campaignNodes}
            onChange={(parentId) => updateNode.mutate({ parentId })}
          />
        </section>
      )}

      {/* Parent / Children */}
      {node.parent && (
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Parent:{" "}
            <button
              onClick={() => navigate(`/campaigns/${campaignId}/nodes/${node.parent!.id}`)}
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              {node.parent.title}
            </button>
          </p>
        </section>
      )}
      {node.children && node.children.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Children</h3>
          <div className="flex flex-wrap gap-2">
            {node.children.map((child) => (
              <button
                key={child.id}
                onClick={() => navigate(`/campaigns/${campaignId}/nodes/${child.id}`)}
                className="rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {child.title}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Links */}
      {(node.outgoingLinks?.length || node.incomingLinks?.length) ? (
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white">Links</h2>
          {node.outgoingLinks && node.outgoingLinks.length > 0 && (
            <div className="mb-3">
              <h3 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Outgoing</h3>
              <div className="flex flex-wrap gap-2">
                {node.outgoingLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => navigate(`/campaigns/${campaignId}/nodes/${link.target!.id}`)}
                    className="rounded-lg bg-blue-50 px-3 py-1 text-sm text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
                  >
                    {link.label ? `${link.label}: ` : ""}
                    {link.target!.title}
                  </button>
                ))}
              </div>
            </div>
          )}
          {node.incomingLinks && node.incomingLinks.length > 0 && (
            <div>
              <h3 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Incoming</h3>
              <div className="flex flex-wrap gap-2">
                {node.incomingLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => navigate(`/campaigns/${campaignId}/nodes/${link.source!.id}`)}
                    className="rounded-lg bg-green-50 px-3 py-1 text-sm text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30"
                  >
                    {link.label ? `${link.label}: ` : ""}
                    {link.source!.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : null}

      {/* Tags */}
      {node.tags.length > 0 && (
        <section className="flex flex-wrap gap-2">
          {node.tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            >
              #{tag.tag}
            </span>
          ))}
        </section>
      )}

      {/* Blocks */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Blocks</h2>
          <button
            onClick={() => setShowAddBlock(true)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Add Block
          </button>
        </div>

        <div className="space-y-3">
          {blocks?.map((block) => (
            <div
              key={block.id}
              className={`rounded-lg border p-4 ${
                block.visibility === "PRIVATE"
                  ? "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/10"
                  : block.visibility === "DM_ONLY"
                  ? "border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-900/10"
                  : "border-gray-100 dark:border-gray-800"
              }`}
            >
              {editingBlock === block.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editBlockContent}
                    onChange={(e) => setEditBlockContent(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <select
                    value={editBlockVisibility}
                    onChange={(e) => setEditBlockVisibility(e.target.value as Visibility)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    {VISIBILITY_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveBlock(block.id)}
                      className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingBlock(null)}
                      className="rounded-lg px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {block.type}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          block.visibility === "PUBLIC"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : block.visibility === "PRIVATE"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                            : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                        }`}
                      >
                        {block.visibility}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        by {block.author.displayName}
                      </span>
                    </div>
                    {(block.authorId === user?.id || isDm) && (
                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            startEditingBlock(block.id, block.content, block.visibility)
                          }
                          className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Delete this block?")) {
                              deleteBlock.mutate(block.id);
                            }
                          }}
                          className="rounded px-2 py-0.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                    {(block.content.text as string) || ""}
                  </div>
                </div>
              )}
            </div>
          ))}

          {(!blocks || blocks.length === 0) && (
            <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              No blocks yet. Add one to get started.
            </p>
          )}
        </div>
      </section>

      {/* Add Block Modal */}
      {showAddBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">Add Block</h2>
            <form onSubmit={handleCreateBlock} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type
                </label>
                <select
                  value={newBlockType}
                  onChange={(e) => setNewBlockType(e.target.value as BlockType)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {BLOCK_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Content
                </label>
                <textarea
                  value={newBlockContent}
                  onChange={(e) => setNewBlockContent(e.target.value)}
                  rows={6}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Visibility
                </label>
                <select
                  value={newBlockVisibility}
                  onChange={(e) => setNewBlockVisibility(e.target.value as Visibility)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {VISIBILITY_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBlock(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBlock.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {createBlock.isPending ? "Adding..." : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ParentSelector({
  node,
  campaignNodes,
  onChange,
}: {
  node: { id: string; parentId: string | null };
  campaignNodes: { id: string; title: string; type: string }[];
  onChange: (parentId: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | "none">(
    node.parentId || "none",
  );

  const otherNodes = campaignNodes.filter((n) => n.id !== node.id);

  if (otherNodes.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No other nodes available.</p>;
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {node.parentId
            ? otherNodes.find((n) => n.id === node.parentId)?.title || "Unknown"
            : "None"}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedParentId}
        onChange={(e) => setSelectedParentId(e.target.value)}
        className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      >
        <option value="none">No parent</option>
        {otherNodes.map((n) => (
          <option key={n.id} value={n.id}>
            {n.title} ({n.type})
          </option>
        ))}
      </select>
      <button
        onClick={() => {
          onChange(selectedParentId === "none" ? null : selectedParentId);
          setEditing(false);
        }}
        className="rounded-lg bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
      >
        Save
      </button>
      <button
        onClick={() => {
          setSelectedParentId(node.parentId || "none");
          setEditing(false);
        }}
        className="rounded-lg px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      >
        Cancel
      </button>
    </div>
  );
}
