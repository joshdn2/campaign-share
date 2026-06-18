/**
 * AddLinkModal.tsx
 *
 * Modal dialog for creating a manual bidirectional link from the current node
 * to another node in the same campaign.
 *
 * The user first picks a node type, then picks a node of that type from the
 * campaign's visible nodes. An optional label up to 30 characters can be added.
 */

import { useMemo, useState } from "react";
import { useCampaignNodes } from "../../hooks/useNodes";
import type { NodeType } from "../../types";

interface Props {
  nodeId: string;
  campaignId: string;
  onAdd: (data: { targetId: string; label?: string }) => Promise<void>;
  onClose: () => void;
  isPending: boolean;
}

const NODE_TYPES: NodeType[] = [
  "SESSION",
  "CHARACTER",
  "CREATURE",
  "ITEM",
  "LOCATION",
  "NOTE",
  "FACTION",
];

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  SESSION: "Session",
  CHARACTER: "Character",
  CREATURE: "Creature",
  ITEM: "Item",
  LOCATION: "Location",
  NOTE: "Note",
  FACTION: "Faction",
};

/**
 * AddLinkModal – form for linking the current node to another campaign node.
 *
 * State:
 *  - selectedType: node type filter for the target dropdown
 *  - selectedTargetId: id of the node to link to
 *  - label: optional short descriptor (max 30 chars)
 */
export function AddLinkModal({ nodeId, campaignId, onAdd, onClose, isPending }: Props) {
  const [selectedType, setSelectedType] = useState<NodeType | "">("");
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [label, setLabel] = useState<string>("");

  const { data: campaignNodes, isLoading: isLoadingNodes } = useCampaignNodes(campaignId);

  const targetOptions = useMemo(() => {
    if (!campaignNodes || !selectedType) return [];
    return campaignNodes
      .filter((node) => node.type === selectedType && node.id !== nodeId)
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [campaignNodes, selectedType, nodeId]);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as NodeType | "";
    setSelectedType(type);
    setSelectedTargetId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId) return;
    await onAdd({ targetId: selectedTargetId, label: label.trim() || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">Add Link</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type
            </label>
            <select
              value={selectedType}
              onChange={handleTypeChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select type</option>
              {NODE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {NODE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Node
            </label>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              required
              disabled={!selectedType || isLoadingNodes}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">
                {isLoadingNodes ? "Loading..." : "Select node"}
              </option>
              {targetOptions.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={30}
              placeholder="e.g., works at, owner of"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <p className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
              {label.length}/30
            </p>
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
              disabled={isPending || !selectedTargetId}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
