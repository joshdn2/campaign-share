/**
 * LinksSection.tsx
 *
 * Renders relationships between nodes. This includes:
 *  - Manually-created NodeLink records (treated as undirected; the current node
 *    may appear in either the source or target side of the record).
 *  - Mention-style links derived from TEXT block tags using the syntax
 *    @[Node Title](node-id).
 *
 * NOTE: This version is designed to be placed inside a CollapsibleSection
 * wrapper, so it does not render its own outer card or title.
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { extractNodeTags } from "../../lib/tags";
import { useAuthStore } from "../../stores/authStore";
import { useDeleteLink } from "../../hooks/useNodes";
import type { Node, NodeBlock, NodeLink } from "../../types";

interface Props {
  node: Node;
  campaignId: string;
  /** Blocks used to derive mention-style outgoing links. */
  blocks?: NodeBlock[];
}

interface NormalizedLink {
  id: string;
  label: string | null;
  createdBy: string;
  otherNode: { id: string; title: string; type: string };
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3 w-3"
    >
      <path
        fillRule="evenodd"
        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * LinksSection – renders manual node links as a single unified list, plus
 * outgoing mentions parsed from TEXT block tags.
 */
export function LinksSection({ node, campaignId, blocks }: Props) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const deleteLink = useDeleteLink(node.id, campaignId);

  const isOwner = node.ownerId === user?.id;
  const isDm = node.campaign?.dmId === user?.id;

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

  // Normalize manual links into a single undirected list. The current node may
  // be the source or the target; we always display the "other" node.
  const manualLinks = useMemo<NormalizedLink[]>(() => {
    const allLinks: NodeLink[] = [
      ...(node.outgoingLinks ?? []),
      ...(node.incomingLinks ?? []),
    ];
    const seen = new Set<string>();
    const result: NormalizedLink[] = [];

    for (const link of allLinks) {
      const otherNode = link.sourceId === node.id ? link.target : link.source;
      if (!otherNode || seen.has(otherNode.id)) continue;
      seen.add(otherNode.id);
      result.push({
        id: link.id,
        label: link.label,
        createdBy: link.createdBy,
        otherNode,
      });
    }

    return result.sort((a, b) => a.otherNode.title.localeCompare(b.otherNode.title));
  }, [node.outgoingLinks, node.incomingLinks, node.id]);

  // Manual link target ids, used to avoid duplicate buttons when a node is both
  // manually linked and mentioned.
  const manualLinkIds = useMemo(
    () => new Set(manualLinks.map((link) => link.otherNode.id)),
    [manualLinks],
  );

  const hasManualLinks = manualLinks.length > 0;
  const hasMentions = mentions.length > 0;

  const handleDelete = async (linkId: string) => {
    if (!confirm("Delete this link?")) return;
    await deleteLink.mutateAsync(linkId);
  };

  // Nothing to render if all directions are empty.
  if (!hasManualLinks && !hasMentions) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No links yet. Use the + button to add one, or tag a node with @ in a TEXT block.
      </p>
    );
  }

  return (
    <div>
      {/* Unified manual links list */}
      {hasManualLinks && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {manualLinks.map((link) => {
              const canDelete = isOwner || isDm || link.createdBy === user?.id;
              return (
                <span
                  key={link.id}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                >
                  <button
                    onClick={() =>
                      navigate(`/campaigns/${campaignId}/nodes/${link.otherNode.id}`)
                    }
                    className="hover:underline"
                  >
                    {link.label ? `${link.label}: ` : ""}
                    {link.otherNode.title}
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(link.id)}
                      disabled={deleteLink.isPending}
                      className="ml-0.5 rounded p-0.5 text-blue-600 hover:bg-blue-100 disabled:opacity-50 dark:text-blue-300 dark:hover:bg-blue-900/30"
                      aria-label="Delete link"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Mentions derived from TEXT block tags */}
      {hasMentions && (
        <div>
          <h3 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Mentions
          </h3>
          <div className="flex flex-wrap gap-2">
            {mentions
              .filter((mention) => !manualLinkIds.has(mention.id))
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
    </div>
  );
}
