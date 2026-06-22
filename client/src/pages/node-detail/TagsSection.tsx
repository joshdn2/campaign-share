import type { NodeTag } from "../../types";

/**
 * ============================================================================
 * node-detail/TagsSection.tsx
 * ============================================================================
 *
 * Renders the tags attached to a node as a row of pill badges.
 * The section is hidden when the node has no tags.
 */

interface Props {
  tags: NodeTag[];
}

/**
 * TagsSection – renders node tags as a row of pills.
 *
 * Each tag is prefixed with "#" to visually distinguish it as a tag.
 */
export function TagsSection({ tags }: Props) {
  if (tags.length === 0) return null;

  return (
    <section className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="rounded-full border border-accent-subtle bg-surface px-3 py-1 text-xs font-medium text-muted dark:border-accent-subtle dark:bg-surface dark:text-secondary"
        >
          #{tag.tag}
        </span>
      ))}
    </section>
  );
}
