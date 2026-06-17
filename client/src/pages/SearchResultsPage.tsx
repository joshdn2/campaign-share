/**
 * SearchResultsPage.tsx
 *
 * Dedicated search results route. Reads the query string (`?q=...`) and an
 * optional campaign id from the URL, then fetches ranked, paginated results
 * from the backend. Results link straight to their node detail pages.
 *
 * Routes:
 *  - /search?q=...                       – search across all my campaigns
 *  - /campaigns/:campaignId/search?q=... – search within a single campaign
 */

import { useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useSearchResults } from "../hooks/useSearch";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import type { SearchResult, NodeType } from "../types";

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  SESSION: "Session",
  CHARACTER: "Character",
  CREATURE: "Creature",
  ITEM: "Item",
  LOCATION: "Location",
  NOTE: "Note",
  FACTION: "Faction",
};

const MATCHED_FIELD_LABELS: Record<string, string> = {
  title: "Title",
  excerpt: "Excerpt",
  block: "Block",
};

/**
 * SearchResultsPage – full-page ranked search results.
 */
export function SearchResultsPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get("q") || "";
  const page = Math.max(Number(searchParams.get("page") || 1), 1);

  const { data, isLoading, error } = useSearchResults(q, campaignId, page);

  const setPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(nextPage));
    setSearchParams(params);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error.message || "Search failed"} />;
  }

  const response = data;
  const total = response?.total ?? 0;
  const results = response?.results ?? [];
  const totalPages = response?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Search results
        </h1>
        {q ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {total} {total === 1 ? "result" : "results"} for "{q}"
            {campaignId ? " in this campaign" : " across all your campaigns"}
          </p>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter a search term above to find nodes.
          </p>
        )}
      </div>

      {/* Results list */}
      {results.length === 0 && !isLoading && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-gray-600 dark:text-gray-400">
            No nodes matched your search.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {results.map((result) => (
          <ResultCard key={result.id} result={result} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

/**
 * ResultCard – single search result with title, excerpt, metadata, and
 * matched-field badges.
 */
function ResultCard({ result }: { result: SearchResult }) {
  return (
    <Link
      to={`/campaigns/${result.campaignId}/nodes/${result.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {NODE_TYPE_LABELS[result.type]}
        </span>
        {result.matchedFields.map((field) => (
          <span
            key={field}
            className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            {MATCHED_FIELD_LABELS[field] || field}
          </span>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
        {result.title}
      </h2>

      {result.excerpt && (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {result.excerpt}
        </p>
      )}

      <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
        {result.campaignName}
      </p>
    </Link>
  );
}

/**
 * Pagination – simple previous/next + page numbers.
 */
function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = useMemo(() => {
    const items: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
      return items;
    }

    items.push(1);
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    if (start > 2) items.push("...");
    for (let i = start; i <= end; i++) items.push(i);
    if (end < totalPages - 1) items.push("...");
    items.push(totalPages);

    return items;
  }, [page, totalPages]);

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        Previous
      </button>

      {pages.map((p, index) =>
        p === "..." ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 text-sm text-gray-500 dark:text-gray-400"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              p === page
                ? "bg-blue-600 text-white"
                : "border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        Next
      </button>
    </div>
  );
}
