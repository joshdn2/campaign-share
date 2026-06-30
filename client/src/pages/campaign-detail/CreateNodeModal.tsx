import { useState } from "react";
import { CalendarDatePicker } from "../../components/calendar/CalendarDatePicker";
import { absoluteDayForDate } from "../../lib/calendar";
import type { CampaignCalendar, CalendarDate, NodeType } from "../../types";

/**
 * ============================================================================
 * campaign-detail/CreateNodeModal.tsx
 * ============================================================================
 *
 * Modal dialog for creating a new node. For SESSION nodes, optional start/end
 * dates can be picked from the campaign calendar. Dates are optional; if a
 * start date is chosen, the end date is prefilled to match.
 */

interface Props {
  label: string;
  type?: NodeType;
  calendar?: CampaignCalendar;
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
  onCreate,
  onClose,
  isPending,
}: Props) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<CalendarDate | null>(null);
  const [endDate, setEndDate] = useState<CalendarDate | null>(null);

  const showDates = type === "SESSION" && calendar != null;

  const handleStartDateChange = (value: CalendarDate | null) => {
    setDateError(null);
    setStartDate(value);
    if (value == null) {
      // If start date is cleared, keep end date as-is so the user can still
      // have an end-only date (which validation below will reject).
      return;
    }
    if (endDate == null) {
      setEndDate(value);
    } else if (calendar) {
      const startAbs = absoluteDayForDate(calendar, value);
      const endAbs = absoluteDayForDate(calendar, endDate);
      if (startAbs != null && endAbs != null && endAbs < startAbs) {
        setEndDate(value);
      }
    }
  };

  const handleEndDateChange = (value: CalendarDate | null) => {
    setDateError(null);
    setEndDate(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDateError(null);

    if (showDates && calendar) {
      if (endDate != null && startDate == null) {
        setDateError("A start date is required when an end date is set.");
        return;
      }
      if (startDate && endDate) {
        const startAbs = absoluteDayForDate(calendar, startDate);
        const endAbs = absoluteDayForDate(calendar, endDate);
        if (startAbs != null && endAbs != null && endAbs < startAbs) {
          setDateError("End date cannot be before the start date.");
          return;
        }
      }
    }

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
    setDateError(null);
    setStartDate(null);
    setEndDate(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-elevated p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-primary">
          New {label}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-primary dark:text-secondary">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-default px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-default dark:bg-surface dark:text-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-primary dark:text-secondary">
              Excerpt
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-default px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-default dark:bg-surface dark:text-primary"
            />
          </div>

          {showDates && (
            <div className="space-y-3 rounded-lg border border-transparent bg-item-bg p-3">
              <p className="text-xs text-muted dark:text-secondary">
                Dates are optional. Setting a start date will prefill the end
                date to the same day.
              </p>
              {dateError && (
                <p className="rounded bg-danger-subtle px-2 py-1 text-xs text-danger dark:bg-danger-subtle dark:text-danger">
                  {dateError}
                </p>
              )}
              <CalendarDatePicker
                calendar={calendar}
                value={startDate}
                onChange={handleStartDateChange}
                label="Start Date"
              />
              <CalendarDatePicker
                calendar={calendar}
                value={endDate}
                onChange={handleEndDateChange}
                label="End Date"
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-primary hover:bg-surface dark:text-secondary dark:hover:bg-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-text-on-accent hover:bg-accent-hover disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
