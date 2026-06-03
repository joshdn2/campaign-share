import { useNavigate } from "react-router-dom";
import type { Node } from "../../types";

// Lists arcs with their child sessions. Each arc has a "+ Session" button.
interface Props {
  campaignId: string;
  arcs: Node[];
  sessions: Node[];
  onAddSession: (arcId: string) => void;
}

export function ArcsSection({ campaignId, arcs, sessions, onAddSession }: Props) {
  const navigate = useNavigate();

  if (arcs.length === 0) return null;

  const arcSessions = (arcId: string) => sessions.filter((s) => s.parentId === arcId);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Arcs</h2>
      <div className="space-y-4">
        {arcs.map((arc) => (
          <div key={arc.id} className="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
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
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => onAddSession(arc.id)}
                className="rounded px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                + Session
              </button>
            </div>
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
