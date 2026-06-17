/**
 * LinksSection.tsx
 *
 * Renders relationships between nodes. This includes:
 *  - Manually-created NodeLink records (outgoing and incoming).
 *  - Mention-style links derived from TEXT block tags using the syntax
 *    @[Node Title](node-id). These are shown as "Outgoing" mentions.
 *
 * The component returns a placeholder message when there are no links in any
 * direction.
 *
 * NOTE: This version is designed to be placed inside a CollapsibleSection
 * wrapper, so it does not render its own outer card or title.
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { extractNodeTags } from "../../lib/tags";
import type { Node, NodeBlock } from "../../types";

interface Props {
  node: Node;
  campaignId: string;
  /** Blocks used to derive mention-style outgoing links. */
  blocks?: NodeBlock[];
}

/**
 * LinksSection – renders incoming and outgoing node links, plus outgoing
 * mentions parsed from TEXT block tags.
 */
export function LinksSection({ node, campaignId, blocks }: Props) {
  const navigate = useNavigate();

  // Collect outgoing mentions from TEXT block tags. Deduplicate by target id
  // and prefer the title stored in the tag.
  const mentions = useMemo(() => {
    const map = new Map<string, { id: string; title: string }>();
    for (const block of blocks ?? []) {
      if (block.type !== "TEXT") continue;
      const text = (block.content.text as string) || "";
      for (const tag of extractNodeTags(text)) {
        if (!map.has(tag.nodeId)) {
          map.set(tag.nodeId, { id: tag.nodeId, title: tag.title });
        }
      }
    }
    return Array.from(map.values());
  }, [blocks]);

  // Manual outgoing link target ids, used to avoid duplicate buttons when a
  // node is both manually linked and mentioned.
  const outgoingTargetIds = useMemo(
    () => new Set((node.outgoingLinks ?? []).map((link) => link.target!.id)),
    [node.outgoingLinks],
  );

  const hasOutgoingLinks = (node.outgoingLinks?.length ?? 0) > 0;
  const hasIncomingLinks = (node.incomingLinks?.length ?? 0) > 0;
  const hasMentions = mentions.length > 0;

  // Nothing to render if all directions are empty.
  if (!hasOutgoingLinks && !hasIncomingLinks && !hasMentions) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No links yet. Tag a node with @ in a TEXT block to create a mention.
      </p>
    );
  }

  return (
    <div>
      {/* Outgoing links: this node -> target nodes */}
      {hasOutgoingLinks && (
        <div className="mb-3">
          <h3 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Outgoing
          </h3>
          <div className="flex flex-wrap gap-2">
            {node.outgoingLinks!.map((link) => (
              <button
                key={link.id}
                onClick={() =>
                  navigate(`/campaigns/${campaignId}/nodes/${link.target!.id}`)
                }
                className="rounded-lg bg-blue-50 px-3 py-1 text-sm text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
              >
                {link.label ? `${link.label}: ` : ""}
                {link.target!.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mentions derived from TEXT block tags */}
      {hasMentions && (
        <div className="mb-3">
          <h3 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Mentions
          </h3>
          <div className="flex flex-wrap gap-2">
            {mentions
              .filter((mention) => !outgoingTargetIds.has(mention.id))
              .map((mention) => (
                <button
                  key={mention.id}
                  onClick={() =>
                    navigate(`/campaigns/${campaignId}/nodes/${mention.id}`)
                  }
                  className="rounded-lg bg-indigo-50 px-3 py-1 text-sm text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
                >
                  mention: {mention.title}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Incoming links: source nodes -> this node */}
      {hasIncomingLinks && (
        <div>
          <h3 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Incoming
          </h3>
          <div className="flex flex-wrap gap-2">
            {node.incomingLinks!.map((link) => (
              <button
                key={link.id}
                onClick={() =>
                  navigate(`/campaigns/${campaignId}/nodes/${link.source!.id}`)
                }
                className="rounded-lg bg-green-50 px-3 py-1 text-sm text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30"
              >
                {link.label ? `${link.label}: ` : ""}
                {link.source!.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
