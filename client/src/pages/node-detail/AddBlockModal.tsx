/**
 * AddBlockModal.tsx
 *
 * Modal dialog for adding a new content block to a node.
 *
 * Blocks have:
 *  - type: TEXT or RICH_TEXT
 *  - content: a JSON object; this UI stores the user's input as `content.text`
 *  - visibility: PRIVATE, PUBLIC, or DM_ONLY
 *
 * For TEXT blocks an "@" button lets the user tag another node in the campaign.
 */

import { useState, useRef } from "react";
import { NodeTagInsert } from "../../components/blocks/NodeTagInsert";
import type { BlockType, Visibility } from "../../types";

interface Props {
  onAdd: (data: { type: BlockType; content: Record<string, unknown>; visibility: Visibility }) => Promise<void>;
  onClose: () => void;
  isPending: boolean;
  /** Campaign id used to scope the tag search. */
  campaignId: string;
  /** Node that owns the block (excluded from tag search). */
  nodeId: string;
}

/**
 * AddBlockModal – form for adding a new text/rich-text block to a node.
 *
 * State:
 *  - type: block type selector (TEXT / RICH_TEXT)
 *  - content: plain-text content stored in `{ text: content }`
 *  - visibility: who can see the block once saved
 */
export function AddBlockModal({ onAdd, onClose, isPending, campaignId, nodeId }: Props) {
  const [type, setType] = useState<BlockType>("TEXT");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Submits the block, then resets the form to defaults and closes. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAdd({ type, content: { text: content }, visibility });
    onClose();
    setContent("");
    setVisibility("PUBLIC");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">Add Block</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as BlockType)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="TEXT">TEXT</option>
              <option value="RICH_TEXT">RICH_TEXT</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {type === "TEXT" && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Tag a node:</span>
                <NodeTagInsert
                  campaignId={campaignId}
                  currentNodeId={nodeId}
                  textareaRef={textareaRef}
                  content={content}
                  onChange={setContent}
                />
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Visibility)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="PRIVATE">PRIVATE</option>
              <option value="PUBLIC">PUBLIC</option>
              <option value="DM_ONLY">DM_ONLY</option>
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
