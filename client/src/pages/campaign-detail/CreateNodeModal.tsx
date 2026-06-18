import { useMemo, useState } from "react";
import { CalendarDatePicker } from "../../components/calendar/CalendarDatePicker";
import { getDefaultCalendarDate } from "../../lib/calendar";
import type { CampaignCalendar, CalendarDate, Node, NodeType } from "../../types";

/**
 * ============================================================================
 * campaign-detail/CreateNodeModal.tsx
 * ============================================================================
 *
 * Modal dialog for creating a new node. For SESSION nodes, optional start/end
 * dates can be picked from the campaign calendar. The start date is prefilled
 * with the end date of the most recently created session, if one exists.
 */

interface Props {
  label: string;
  type?: NodeType;
  calendar?: CampaignCalendar;
  nodes?: Node[];
  onCreate: (data: {
    title: string;
    excerpt: string;
    startDate?: CalendarDate;
    endDate?: CalendarDate;
  }) => Promise<void>;
  onClose: () => void;
  isPending: boolean;
}

export function CreateNodeModal({
  label,
  type,
  calendar,
  nodes,
  onCreate,
  onClose,
  isPending,
}: Props) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");

  const defaultStartDate = useMemo(() => {
    if (!calendar) return null;

    // Most recently created session (by node createdAt), if any.
    const sessionNodes = (nodes ?? []).filter((n) => n.type === "SESSION");
    const sorted = [...sessionNodes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    for (const session of sorted) {
      const detail = session.sessionDetail;
      if (!detail?.endDateMonthId) continue;
      return {
        ageId: detail.endDateAgeId!,
        year: detail.endDateYear!,
        monthId: detail.endDateMonthId!,
        day: detail.endDateDay!,
      };
    }

    return getDefaultCalendarDate(calendar, sessionNodes);
  }, [calendar, nodes]);

  const [startDate, setStartDate] = useState<CalendarDate | null>(defaultStartDate);
  const [endDate, setEndDate] = useState<CalendarDate | null>(defaultStartDate);

  const showDates = type === "SESSION" && calendar != null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreate({
      title,
      excerpt,
      ...(showDates
        ? {
            startDate: startDate ?? undefined,
            endDate: endDate ?? undefined,
          }
        : {}),
    });
    onClose();
    setTitle("");
    setExcerpt("");
    setStartDate(defaultStartDate);
    setEndDate(defaultStartDate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">
          New {label}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Excerpt
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {showDates && (
            <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Dates are optional. Start date is prefilled from the most recent session.
              </p>
              <CalendarDatePicker
                calendar={calendar}
                value={startDate}
                onChange={setStartDate}
                label="Start Date"
              />
              <CalendarDatePicker
                calendar={calendar}
                value={endDate}
                onChange={setEndDate}
                label="End Date"
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
