import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { JSONContent } from "@tiptap/core";

/**
 * ============================================================================
 * blocks/RichTextEditor.tsx
 * ============================================================================
 *
 * WYSIWYG editor for RICH_TEXT blocks. Built on TipTap with StarterKit.
 * Provides a small toolbar for bold, italic, headings, and lists.
 */

interface Props {
  content: JSONContent;
  onChange: (content: JSONContent) => void;
}

const emptyDocument: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function RichTextEditor({ content, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: isEmptyContent(content) ? emptyDocument : content,
    onUpdate: ({ editor: e }) => {
      onChange(e.getJSON());
    },
  });

  if (!editor) {
    return (
      <div className="min-h-[8rem] rounded-lg border border-default bg-surface px-3 py-2 text-sm text-muted dark:border-default dark:bg-surface dark:text-secondary">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-default bg-elevated dark:border-default dark:bg-surface">
      <div className="flex flex-wrap items-center gap-1 border-b border-default px-2 py-1 dark:border-default">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          label="Heading"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </ToolbarButton>
        <ToolbarButton
          label="Ordered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </ToolbarButton>
      </div>
      <EditorContent
        editor={editor}
        className="rich-text px-3 py-2 text-sm text-primary dark:text-primary [&_.ProseMirror]:min-h-[6rem] [&_.ProseMirror]:outline-none"
      />
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-accent text-text-on-accent"
          : "text-muted hover:bg-surface dark:text-secondary dark:hover:bg-surface"
      }`}
    >
      {children}
    </button>
  );
}

function isEmptyContent(content: JSONContent): boolean {
  if (!content) return true;
  if (content.type === "doc") {
    const children = content.content;
    if (!children || children.length === 0) return true;
    if (
      children.length === 1 &&
      children[0]?.type === "paragraph" &&
      (!children[0].content || children[0].content.length === 0)
    ) {
      return true;
    }
  }
  return false;
}
