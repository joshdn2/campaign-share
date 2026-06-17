/**
 * useSearch.ts
 *
 * TanStack Query hooks for the global/campaign-scoped search feature.
 * Includes a lightweight suggestions hook for the navbar dropdown and a
 * paginated results hook for the dedicated search results page.
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/axios";
import type { SearchResultsResponse, SearchSuggestion } from "../types";

const SEARCH_KEY = "search";

/**
 * Debounce helper.
 *
 * Returns the latest value after `delay` ms of inactivity. Used to avoid
 * firing a suggestion request on every keystroke.
 */
function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/**
 * Fetches title-only suggestions for the navbar search dropdown.
 *
 * @param q - The current search term.
 * @param campaignId - Optional campaign scope.
 * @returns A TanStack Query result wrapping SearchSuggestion[].
 *
 * The query is disabled until the user has typed at least one non-whitespace
 * character and the debounced term has settled.
 */
export function useSearchSuggestions(
  q: string,
  campaignId?: string,
  excludeNodeId?: string,
) {
  const debouncedQ = useDebouncedValue(q.trim(), 200);

  return useQuery({
    queryKey: [SEARCH_KEY, "suggestions", debouncedQ, campaignId, excludeNodeId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("q", debouncedQ);
      if (campaignId) params.set("campaignId", campaignId);
      if (excludeNodeId) params.set("excludeNodeId", excludeNodeId);
      const res = await api.get<{ suggestions: SearchSuggestion[] }>(`/nodes/search/suggestions?${params.toString()}`);
      return res.data.suggestions;
    },
    enabled: debouncedQ.length > 0,
  });
}

/**
 * Fetches paginated search results for the search results page.
 *
 * @param q - The search term (from the URL).
 * @param campaignId - Optional campaign scope.
 * @param page - One-based page index.
 * @param limit - Results per page.
 * @returns A TanStack Query result wrapping SearchResultsResponse.
 */
export function useSearchResults(q: string, campaignId?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: [SEARCH_KEY, "results", q, campaignId, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("q", q);
      if (campaignId) params.set("campaignId", campaignId);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await api.get<SearchResultsResponse>(`/nodes/search?${params.toString()}`);
      return res.data;
    },
    enabled: q.trim().length > 0,
  });
}
