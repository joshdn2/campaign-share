import { useMemo } from "react";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import type { JSONContent } from "@tiptap/core";

/**
 * ============================================================================
 * blocks/RichTextRenderer.tsx
 * ============================================================================
 *
 * Read-only rendering of a TipTap JSON document for RICH_TEXT blocks.
 * Converts the structured content to HTML using the same extension set as the
 * editor so the output is consistent and safe.
 */

interface Props {
  content: JSONContent;
}

export function RichTextRenderer({ content }: Props) {
  const html = useMemo(() => {
    try {
      return generateHTML(content, [StarterKit]);
    } catch {
      return "";
    }
  }, [content]);

  if (!html) {
    return (
      <span className="text-sm text-muted italic dark:text-secondary">
        Empty rich text block
      </span>
    );
  }

  return (
    <div
      className="rich-text text-sm text-primary dark:text-secondary"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
