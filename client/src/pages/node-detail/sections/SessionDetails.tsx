/**
 * SessionDetails.tsx
 *
 * Detail section for SESSION nodes. Displays the session number, date, and
 * short/long summaries. DM or the session owner can edit the start/end dates
 * using the campaign's custom calendar.
 */

import { useState, useMemo } from "react";
import type { Node, CalendarDate } from "../../../types";
import { useAuthStore } from "../../../stores/authStore";
import { useCalendar } from "../../../hooks/useCalendars";
import { useCampaignNodes } from "../../../hooks/useNodes";
import { useUpdateNode } from "../../../hooks/useNodes";
import { CalendarDatePicker } from "../../../components/calendar/CalendarDatePicker";
import {
  absoluteDayForDate,
  formatCalendarDate,
  getDefaultCalendarDate,
} from "../../../lib/calendar";

interface Props {
  node: Node;
}

function toCalendarDate(detail: Node["sessionDetail"], field: "startDate" | "endDate"): CalendarDate | null {
  if (!detail) return null;
  const ageId = field === "startDate" ? detail.startDateAgeId : detail.endDateAgeId;
  const year = field === "startDate" ? detail.startDateYear : detail.endDateYear;
  const monthId = field === "startDate" ? detail.startDateMonthId : detail.endDateMonthId;
  const day = field === "startDate" ? detail.startDateDay : detail.endDateDay;
  if (!ageId || year == null || !monthId || day == null) return null;
  return { ageId, year, monthId, day };
}

export function SessionDetails({ node }: Props) {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);

  const campaignId = node.campaignId ?? "";
  const { data: calendar } = useCalendar(campaignId);
  const { data: campaignNodes } = useCampaignNodes(campaignId);
  const updateNode = useUpdateNode(node.id);

  const sessions = useMemo(
    () => (campaignNodes ?? []).filter((n) => n.type === "SESSION"),
    [campaignNodes],
  );

  const isOwner = node.ownerId === user?.id;
  const isDm = node.campaign?.dmId === user?.id;
  const canEdit = isOwner || isDm;

  if (!node.sessionDetail) return null;

  const startDate = toCalendarDate(node.sessionDetail, "startDate");
  const endDate = toCalendarDate(node.sessionDetail, "endDate");

  const handleSave = async (start: CalendarDate | null, end: CalendarDate | null) => {
    await updateNode.mutateAsync({
      details: {
        startDateAgeId: start?.ageId ?? null,
        startDateYear: start?.year ?? null,
        startDateMonthId: start?.monthId ?? null,
        startDateDay: start?.day ?? null,
        endDateAgeId: end?.ageId ?? null,
        endDateYear: end?.year ?? null,
        endDateMonthId: end?.monthId ?? null,
        endDateDay: end?.day ?? null,
      },
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
      <p>
        <span className="font-medium">Session Number:</span> {node.sessionDetail.sessionNumber}
      </p>

      {calendar && (
        <div>
          {isEditing ? (
            <SessionDateEditor
              calendar={calendar}
              sessions={sessions}
              initialStart={startDate}
              initialEnd={endDate}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
              isPending={updateNode.isPending}
            />
          ) : (
            <div className="space-y-1">
              <p>
                <span className="font-medium">Start Date:</span>{" "}
                {formatCalendarDate(calendar, startDate)}
              </p>
              <p>
                <span className="font-medium">End Date:</span>{" "}
                {formatCalendarDate(calendar, endDate)}
              </p>
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Edit Dates
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {node.sessionDetail.sessionDate && (
        <p>
          <span className="font-medium">Real-World Date:</span>{" "}
          {new Date(node.sessionDetail.sessionDate).toLocaleDateString()}
        </p>
      )}

      {node.sessionDetail.shortSummary && (
        <p>
          <span className="font-medium">Short Summary:</span> {node.sessionDetail.shortSummary}
        </p>
      )}
      {node.sessionDetail.longSummary && (
        <p>
          <span className="font-medium">Long Summary:</span> {node.sessionDetail.longSummary}
        </p>
      )}
    </div>
  );
}

interface EditorProps {
  calendar: NonNullable<ReturnType<typeof useCalendar>["data"]>;
  sessions: Node[];
  initialStart: CalendarDate | null;
  initialEnd: CalendarDate | null;
  onSave: (start: CalendarDate | null, end: CalendarDate | null) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

function SessionDateEditor({
  calendar,
  sessions,
  initialStart,
  initialEnd,
  onSave,
  onCancel,
  isPending,
}: EditorProps) {
  const defaultDate = useMemo(
    () => getDefaultCalendarDate(calendar, sessions),
    [calendar, sessions],
  );

  const [start, setStart] = useState<CalendarDate>(initialStart ?? defaultDate);
  const [end, setEnd] = useState<CalendarDate>(initialEnd ?? defaultDate);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    const startAbs = absoluteDayForDate(calendar, start);
    const endAbs = absoluteDayForDate(calendar, end);
    if (startAbs != null && endAbs != null && endAbs < startAbs) {
      setError("End date cannot be before the start date.");
      return;
    }
    void onSave(start, end);
  };

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      {error && (
        <p className="rounded bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}
      <CalendarDatePicker
        calendar={calendar}
        value={start}
        onChange={setStart}
        label="Start Date"
      />
      <CalendarDatePicker
        calendar={calendar}
        value={end}
        onChange={setEnd}
        label="End Date"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        <button
          onClick={onCancel}
          disabled={isPending}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
