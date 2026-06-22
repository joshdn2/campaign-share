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
import { ThemeControls } from "../theme/ThemeControls";
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
    <header className="relative z-50 flex h-14 items-center justify-between border-b border-default bg-navbar-bg px-3  md:px-4">
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile hamburger: only visible on small screens and only when a
            menu click handler has been provided by the layout shell. */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="rounded-md p-1.5 text-muted hover:bg-surface md:hidden dark:text-secondary dark:hover:bg-surface"
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
            className="hidden rounded-md p-1.5 text-muted hover:bg-surface sm:block dark:text-secondary dark:hover:bg-surface"
            title="Back to campaigns"
          >
            ← Back
          </button>
        )}

        {/* App title navigates back to the campaigns list */}
        <h1
          className="cursor-pointer text-base font-bold text-primary md:text-lg"
          onClick={() => navigate("/campaigns")}
        >
          CampaignHub
        </h1>
      </div>

      {/* Centered search bar */}
      <div className="flex-1 px-2 md:px-6 lg:px-12">
        <SearchBar campaignId={campaignId} campaignName={campaign?.name} />
      </div>

      {user && <UserMenu displayName={user.displayName} onLogout={logout} />}
    </header>
  );
}

/**
 * UserMenu – dropdown attached to the authenticated user's name in the navbar.
 *
 * Holds theme controls and the logout action. Closes when the user clicks
 * outside the menu.
 */
function UserMenu({
  displayName,
  onLogout,
}: {
  displayName: string;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface hover:text-text-primary md:px-3"
      >
        <span className="hidden md:inline">{displayName}</span>
        <span className="text-accent md:hidden">☰</span>
        <span className="text-xs text-accent">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border-default bg-surface shadow-lg dark:bg-surface">
          <div className="border-b border-border-subtle px-3 py-2">
            <p className="text-sm font-medium text-text-primary">{displayName}</p>
          </div>
          <ThemeControls />
          <div className="border-t border-border-subtle p-2">
            <button
              onClick={() => {
                onLogout();
                navigate("/login");
                setOpen(false);
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-text-secondary hover:bg-surface hover:text-text-primary"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
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
      <div className="flex items-center overflow-hidden rounded-lg border border-default bg-elevated focus-within:border-accent focus-within:ring-1 focus-within:ring-accent dark:border-default dark:bg-surface">
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
          className="flex-1 bg-transparent px-2 py-1.5 text-sm text-primary placeholder-muted focus:outline-none dark:text-primary dark:placeholder-muted md:px-3"
          aria-label="Search nodes"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={showDropdown}
        />
        <button
          onClick={goToResults}
          className="flex h-8 w-8 items-center justify-center text-muted hover:bg-surface dark:text-secondary dark:hover:bg-surface"
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
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-default bg-elevated shadow-lg dark:border-default dark:bg-elevated"
          role="listbox"
        >
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
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                  index === highlightedIndex
                    ? "bg-accent-subtle text-accent ring-1 ring-inset ring-accent dark:bg-accent-subtle dark:text-accent dark:ring-accent"
                    : "text-primary dark:text-secondary"
                }`}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                <span className="truncate font-medium">{suggestion.title}</span>
                <span className="ml-2 shrink-0 text-xs text-secondary dark:text-muted">
                  {suggestion.type}
                </span>
              </button>
            ))}

          <div className="border-t border-subtle px-3 py-1.5 text-xs text-secondary dark:border-subtle dark:text-muted">
            Press Enter to see all results
          </div>
        </div>
      )}
    </div>
  );
}
