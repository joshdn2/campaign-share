/**
 * AddBlockModal.tsx
 *
 * Modal dialog for adding a new rich-text content block to a node.
 *
 * Blocks are always RICH_TEXT and store TipTap JSON content.
 */

import { useState } from "react";
import type { JSONContent } from "@tiptap/core";
import { RichTextEditor } from "../../components/blocks/RichTextEditor";
import type { Visibility } from "../../types";

interface Props {
  onAdd: (data: {
    type: "RICH_TEXT";
    content: Record<string, unknown>;
    visibility: Visibility;
  }) => Promise<void>;
  onClose: () => void;
  isPending: boolean;
}

const emptyRichText: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

/**
 * AddBlockModal – form for adding a new rich-text block to a node.
 *
 * State:
 *  - richContent: TipTap JSON content
 *  - visibility: who can see the block once saved
 */
export function AddBlockModal({
  onAdd,
  onClose,
  isPending,
}: Props) {
  const [richContent, setRichContent] = useState<JSONContent>(emptyRichText);
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");

  /** Submits the block, then resets the form to defaults and closes. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAdd({ type: "RICH_TEXT", content: { content: richContent }, visibility });
    onClose();
    setRichContent(emptyRichText);
    setVisibility("PUBLIC");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-xl bg-elevated p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-primary">Add Block</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-primary dark:text-secondary">
              Content
            </label>
            <RichTextEditor content={richContent} onChange={setRichContent} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-primary dark:text-secondary">
              Visibility
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Visibility)}
              className="w-full rounded-lg border border-default px-3 py-2 text-sm dark:border-default dark:bg-surface dark:text-primary"
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
