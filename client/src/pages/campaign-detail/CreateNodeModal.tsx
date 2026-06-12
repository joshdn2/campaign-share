import { useState } from "react";

/**
 * ============================================================================
 * campaign-detail/CreateNodeModal.tsx
 * ============================================================================
 *
 * Modal dialog for creating a new node of any type. The caller supplies a
 * label (e.g. "Character") so the modal title reflects the current node type.
 */

interface Props {
  label: string;
  onCreate: (data: { title: string; excerpt: string }) => Promise<void>;
  onClose: () => void;
  isPending: boolean;
}

/**
 * CreateNodeModal – form for creating a new node.
 *
 * State:
 *  - title: required node title
 *  - excerpt: optional short summary shown in lists and grids
 */
export function CreateNodeModal({
  label,
  onCreate,
  onClose,
  isPending,
}: Props) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");

  /** Submits the form, creates the node, and resets local form state. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreate({ title, excerpt });
    onClose();
    setTitle("");
    setExcerpt("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">
          New {label}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Excerpt
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
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
              {isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
