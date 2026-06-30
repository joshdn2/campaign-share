/**
 * NodeTagInsert.tsx
 *
 * Reusable "@" tag button for TEXT block editors. Clicking the @ button opens
 * a small search dropdown scoped to the current campaign. Selecting a node
 * inserts `@[Node Title](node-id)` into the bound textarea at the current cursor
 * position.
 */

import { useState, useRef, useEffect } from "react";
import { useSearchSuggestions } from "../../hooks/useSearch";
import { insertTagAtCursor } from "../../lib/tags";
import type { SearchSuggestion } from "../../types";

interface NodeTagInsertProps {
  /** The campaign to search for taggable nodes. */
  campaignId: string;
  /** The node that owns the block (excluded from suggestions so it can't tag itself). */
  currentNodeId: string;
  /** Ref to the textarea where the tag should be inserted. */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  /** Current block content; the component will call this with the updated text. */
  content: string;
  /** Called when a tag is inserted with the new content value. */
  onChange: (content: string) => void;
}

/**
 * Renders an @ button with a campaign-scoped node search dropdown.
 */
export function NodeTagInsert({
  campaignId,
  currentNodeId,
  textareaRef,
  content,
  onChange,
}: NodeTagInsertProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: suggestions, isLoading } = useSearchSuggestions(
    query,
    campaignId,
    currentNodeId,
  );

  // Close dropdown when clicking outside.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openSearch = () => {
    setIsOpen(true);
    setQuery("");
    // Focus the search input on the next tick so it exists in the DOM.
    setTimeout(() => {
      const input = containerRef.current?.querySelector("input");
      input?.focus();
    }, 0);
  };

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart ?? content.length;
    const updated = insertTagAtCursor(
      content,
      cursor,
      suggestion.id,
      suggestion.title,
    );
    onChange(updated);

    setIsOpen(false);
    setQuery("");
    setHighlightedIndex(-1);

    // Return focus to the textarea and place the cursor after the inserted tag.
    setTimeout(() => {
      textarea.focus();
      const newCursor =
        cursor +
        insertTagAtCursor("", 0, suggestion.id, suggestion.title).length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions || suggestions.length === 0) {
      if (e.key === "Escape") {
        setIsOpen(false);
        textareaRef.current?.focus();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(
          (prev) => (prev - 1 + suggestions.length) % suggestions.length,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          selectSuggestion(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        textareaRef.current?.focus();
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={openSearch}
        className="rounded px-2 py-1 text-sm font-medium text-accent hover:bg-accent-subtle dark:text-accent dark:hover:bg-accent-subtle"
        title="Tag a node"
        aria-label="Tag a node"
      >
        Tag a node
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-lg border border-default bg-elevated shadow-lg dark:border-default dark:bg-elevated">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlightedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tag node..."
            className="w-full border-b border-subtle px-3 py-2 text-sm focus:outline-none dark:border-subtle dark:bg-surface dark:text-primary"
          />

          <div className="max-h-48 overflow-y-auto">
            {isLoading && (
              <div className="px-3 py-2 text-sm text-muted dark:text-secondary">
                Loading...
              </div>
            )}

            {!isLoading && suggestions && suggestions.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted dark:text-secondary">
                No matching nodes
              </div>
            )}

            {!isLoading &&
              suggestions &&
              suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => selectSuggestion(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                    index === highlightedIndex
                      ? "bg-accent-subtle text-accent dark:bg-accent-subtle dark:text-accent"
                      : "text-primary dark:text-secondary"
                  }`}
                >
                  <span className="truncate">{suggestion.title}</span>
                  <span className="ml-2 shrink-0 text-xs text-secondary dark:text-muted">
                    {suggestion.type}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
