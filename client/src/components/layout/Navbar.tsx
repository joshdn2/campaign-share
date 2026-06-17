/**
 * Navbar.tsx
 *
 * Persistent top navigation bar. Shows a hamburger menu on small screens,
 * a back button when viewing a specific campaign, the app brand, a global
 * search input with suggestions, and the authenticated user's display name
 * with a logout action.
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useCampaign } from "../../hooks/useCampaigns";
import { useSearchSuggestions } from "../../hooks/useSearch";
import type { SearchSuggestion } from "../../types";

interface NavbarProps {
  /** Called when the mobile hamburger menu is pressed. */
  onMenuClick?: () => void;
}

/**
 * Renders the application header.
 *
 * Reads the current user from the Zustand auth store and the active
 * campaign id from React Router's URL parameters. When a campaign id is
 * present, an additional "Back" button returns the user to the campaigns
 * list. On mobile a hamburger button opens the sidebar navigation overlay.
 */
export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const { data: campaign } = useCampaign(campaignId ?? "");

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-900 md:px-4">
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile hamburger: only visible on small screens and only when a
            menu click handler has been provided by the layout shell. */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 md:hidden dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Open navigation menu"
            title="Open menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        )}

        {/* Back button appears only when inside a campaign route */}
        {campaignId && (
          <button
            onClick={() => navigate("/campaigns")}
            className="hidden rounded-md p-1.5 text-gray-600 hover:bg-gray-100 sm:block dark:text-gray-300 dark:hover:bg-gray-800"
            title="Back to campaigns"
          >
            ← Back
          </button>
        )}

        {/* App title navigates back to the campaigns list */}
        <h1
          className="cursor-pointer text-base font-bold text-gray-800 dark:text-white md:text-lg"
          onClick={() => navigate("/campaigns")}
        >
          CampaignHub
        </h1>
      </div>

      {/* Centered search bar */}
      <div className="flex-1 px-2 md:px-6 lg:px-12">
        <SearchBar campaignId={campaignId} campaignName={campaign?.name} />
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Show user info and logout only while authenticated */}
        {user && (
          <>
            <span className="hidden text-sm text-gray-600 md:inline dark:text-gray-300">
              {user.displayName}
            </span>
            <button
              onClick={() => {
                // Clear the session in the auth store, then redirect.
                logout();
                navigate("/login");
              }}
              className="rounded-md bg-gray-100 px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 md:px-3 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}

/**
 * SearchBar – centered input with a suggestion dropdown.
 *
 * Scopes suggestions and full-page search to the current campaign when
 * campaignId is present, otherwise searches across all of the user's campaigns.
 */
function SearchBar({
  campaignId,
  campaignName,
}: {
  campaignId?: string;
  campaignName?: string;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: suggestions, isLoading } = useSearchSuggestions(query, campaignId);

  const placeholder = campaignId
    ? `Search ${campaignName ?? "this campaign"}...`
    : "Search all my campaigns";

  // Close the dropdown when clicking outside the search bar.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset highlight when suggestions change.
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  const goToResults = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsOpen(false);
    if (campaignId) {
      navigate(`/campaigns/${campaignId}/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    setIsOpen(false);
    setQuery("");
    navigate(`/campaigns/${suggestion.campaignId}/nodes/${suggestion.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        goToResults();
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
        setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          selectSuggestion(suggestions[highlightedIndex]);
        } else {
          goToResults();
        }
        break;
      case "Escape":
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative max-w-xl">
      <div className="flex items-center overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-gray-700 dark:bg-gray-800">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-2 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder-gray-500 md:px-3"
          aria-label="Search nodes"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={showDropdown}
        />
        <button
          onClick={goToResults}
          className="flex h-8 w-8 items-center justify-center text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          aria-label="Search"
          title="Search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
        </button>
      </div>

      {showDropdown && (
        <div
          id="search-suggestions"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
          role="listbox"
        >
          {isLoading && (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          )}

          {!isLoading && suggestions && suggestions.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              No matching nodes
            </div>
          )}

          {!isLoading &&
            suggestions &&
            suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                  index === highlightedIndex
                    ? "bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100"
                    : "text-gray-700 dark:text-gray-200"
                }`}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                <span className="truncate font-medium">{suggestion.title}</span>
                <span className="ml-2 shrink-0 text-xs text-gray-400 dark:text-gray-500">
                  {suggestion.type}
                </span>
              </button>
            ))}

          <div className="border-t border-gray-100 px-3 py-1.5 text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
            Press Enter to see all results
          </div>
        </div>
      )}
    </div>
  );
}
