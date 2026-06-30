/**
 * tags.ts
 *
 * Shared helpers for the block tagging feature.
 *
 * Tags are stored inline in RICH_TEXT block content using a lightweight
 * markdown-like syntax: @[Node Title](node-id). These functions extract tags
 * from raw text, insert a tag at a cursor position, and render tagged text as a
 * React tree of clickable links.
 */

import type { ReactNode } from "react";

/**
 * Regular expression matching an inline node tag.
 *
 * Matches strings of the form @[Title](uuid). The title can contain any
 * character except `]`; the id must be a UUID-like string of hex digits and
 * hyphens.
 */
export const NODE_TAG_REGEX = /@\[([^\]]+)\]\(([0-9a-fA-F-]{36})\)/g;

/**
 * Escape a node title so it can safely appear inside the tag brackets.
 *
 * Currently only escapes `]` by prefixing it with a backslash. This keeps the
 * regex unambiguous without making the stored syntax noisy.
 */
export function escapeTagTitle(title: string): string {
  return title.replace(/]/g, "\\]");
}

/**
 * Build the inline tag string for a node.
 */
export function buildNodeTag(nodeId: string, title: string): string {
  return `@[${escapeTagTitle(title)}](${nodeId})`;
}

/**
 * Extract all unique node tags from a block of text.
 */
export function extractNodeTags(text: string): Array<{ nodeId: string; title: string }> {
  const regex = new RegExp(NODE_TAG_REGEX);
  const tags: Array<{ nodeId: string; title: string }> = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const title = match[1];
    const nodeId = match[2];
    if (!seen.has(nodeId)) {
      seen.add(nodeId);
      tags.push({ nodeId, title });
    }
  }

  return tags;
}

/**
 * Insert a tag into the text at the given cursor position.
 */
export function insertTagAtCursor(
  text: string,
  cursor: number,
  nodeId: string,
  title: string,
): string {
  const tag = buildNodeTag(nodeId, title);
  return text.slice(0, cursor) + tag + text.slice(cursor);
}

/**
 * Recursively collect all plain text from a TipTap JSON document.
 */
function extractTextFromTipTapJSON(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  if (Array.isArray(node)) {
    return node.map(extractTextFromTipTapJSON).join("");
  }
  const n = node as Record<string, unknown>;
  if (n.type === "text" && typeof n.text === "string") {
    return n.text;
  }
  if (Array.isArray(n.content)) {
    return extractTextFromTipTapJSON(n.content);
  }
  return "";
}

/**
 * Extract node tags from a RICH_TEXT block's TipTap JSON content.
 */
export function extractNodeTagsFromRichText(
  content: Record<string, unknown>,
): Array<{ nodeId: string; title: string }> {
  const text = extractTextFromTipTapJSON(content.content);
  return extractNodeTags(text);
}

/**
 * Render tagged text as an array of React nodes.
 *
 * Plain text is returned as strings; tags are rendered as `Link` elements
 * wrapped in a renderer function provided by the caller.
 */
export function renderTaggedText(
  text: string,
  renderLink: (nodeId: string, title: string, key: string) => ReactNode,
): ReactNode[] {
  const regex = new RegExp(NODE_TAG_REGEX);
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    const [full, title, nodeId] = match;
    const key = `${nodeId}-${match.index}-${keyIndex++}`;

    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    parts.push(renderLink(nodeId, title, key));
    lastIndex = match.index + full.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
