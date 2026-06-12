import { useNavigate } from "react-router-dom";
import type { Node } from "../../types";

/**
 * ============================================================================
 * campaign-detail/ArcsSection.tsx
 * ============================================================================
 *
 * Renders the list of ARC nodes and their child SESSION nodes.
 * Each arc displays its title, excerpt, and a "+ Session" button that
 * pre-configures the create-node modal to add a session under that arc.
 */

interface Props {
  campaignId: string;
  arcs: Node[];
  sessions: Node[];
  onAddSession: (arcId: string) => void;
}

/**
 * ArcsSection – lists arcs with their child sessions.
 *
 * The component returns `null` when there are no arcs so the section is hidden
 * entirely. Sessions are matched to their parent arc via `parentId`.
 */
export function ArcsSection({ campaignId, arcs, sessions, onAddSession }: Props) {
  const navigate = useNavigate();

  // Nothing to show until at least one arc exists.
  if (arcs.length === 0) return null;

  // Derive the sessions whose parentId equals the given arc id.
  const arcSessions = (arcId: string) => sessions.filter((s) => s.parentId === arcId);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 md:p-6 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Arcs</h2>
      <div className="space-y-4">
        {arcs.map((arc) => (
          <div key={arc.id} className="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
            {/* Clicking the arc title navigates to its node detail page */}
            <button
              onClick={() => navigate(`/campaigns/${campaignId}/nodes/${arc.id}`)}
              className="text-left"
            >
              <h3 className="font-semibold text-gray-800 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                {arc.title}
              </h3>
              {arc.excerpt && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{arc.excerpt}</p>
              )}
            </button>

            {/* Action bar for the arc */}
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => onAddSession(arc.id)}
                className="rounded px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                + Session
              </button>
            </div>

            {/* Child sessions rendered indented beneath their parent arc */}
            {arcSessions(arc.id).length > 0 && (
              <div className="mt-3 space-y-1 pl-4">
                {arcSessions(arc.id).map((session) => (
                  <button
                    key={session.id}
                    onClick={() => navigate(`/campaigns/${campaignId}/nodes/${session.id}`)}
                    className="block text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  >
                    └ {session.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
