import type { NodeTag } from "../../types";

// Renders node tags as a row of pills.
export function TagsSection({ tags }: { tags: NodeTag[] }) {
  if (tags.length === 0) return null;

  return (
    <section className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        >
          #{tag.tag}
        </span>
      ))}
    </section>
  );
}
