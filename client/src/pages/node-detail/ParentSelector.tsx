import { useState } from "react";

// Dropdown to change a node's parent. Lists all other nodes in the campaign.
interface Props {
  node: { id: string; parentId: string | null };
  campaignNodes: { id: string; title: string; type: string }[];
  onChange: (parentId: string | null) => void;
}

export function ParentSelector({ node, campaignNodes, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | "none">(node.parentId || "none");

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
