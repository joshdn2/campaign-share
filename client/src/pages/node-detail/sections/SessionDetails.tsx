/**
 * SessionDetails.tsx
 *
 * Detail section for SESSION nodes. Displays the session number, dates, and
 * description in a compact header row, with an inline date editor.
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
  formatCalendarDateNoAge,
  getDefaultCalendarDate,
} from "../../../lib/calendar";

interface Props {
  node: Node;
}

function toCalendarDate(
  detail: Node["sessionDetail"],
  field: "startDate" | "endDate",
): CalendarDate | null {
  if (!detail) return null;
  const ageId =
    field === "startDate" ? detail.startDateAgeId : detail.endDateAgeId;
  const year =
    field === "startDate" ? detail.startDateYear : detail.endDateYear;
  const monthId =
    field === "startDate" ? detail.startDateMonthId : detail.endDateMonthId;
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

  const startDate = toCalendarDate(node.sessionDetail, "startDate");
  const endDate = toCalendarDate(node.sessionDetail, "endDate");

  const handleSave = async (
    start: CalendarDate | null,
    end: CalendarDate | null,
  ) => {
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
    <div className="space-y-3 text-sm text-muted dark:text-secondary">
      {/* Header row: session number, dates, and edit toggle */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {node.sessionDetail && (
            <span className="font-semibold text-primary">
              Session #{node.sessionDetail.sessionNumber}
            </span>
          )}

          {calendar && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                <span className="font-medium">Date:</span>{" "}
                {formatCalendarDateNoAge(calendar, startDate)} -{" "}
                {formatCalendarDate(calendar, endDate)}
              </span>
            </div>
          )}
        </div>

        {calendar && canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-md p-1 text-accent hover:bg-accent-subtle dark:text-accent dark:hover:bg-accent-subtle"
            title="Edit dates"
            aria-label="Edit dates"
          >
            ✏️
          </button>
        )}
      </div>

      {/* Inline date editor */}
      {isEditing && calendar && (
        <SessionDateEditor
          calendar={calendar}
          sessions={sessions}
          initialStart={startDate}
          initialEnd={endDate}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          isPending={updateNode.isPending}
        />
      )}

      {/* Description */}
      {node.excerpt && (
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted dark:text-secondary">
            Description
          </h3>
          <p className="whitespace-pre-wrap text-primary dark:text-secondary">
            {node.excerpt}
          </p>
        </div>
      )}

      {node.sessionDetail?.sessionDate && (
        <p>
          <span className="font-medium">Real-World Date:</span>{" "}
          {new Date(node.sessionDetail.sessionDate).toLocaleDateString()}
        </p>
      )}

      {node.sessionDetail?.shortSummary && (
        <p>
          <span className="font-medium">Short Summary:</span>{" "}
          {node.sessionDetail.shortSummary}
        </p>
      )}

      {node.sessionDetail?.longSummary && (
        <p>
          <span className="font-medium">Long Summary:</span>{" "}
          {node.sessionDetail.longSummary}
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
  onSave: (
    start: CalendarDate | null,
    end: CalendarDate | null,
  ) => Promise<void>;
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
    <div className="space-y-3 rounded-lg border border-transparent bg-item-bg p-3">
      {error && (
        <p className="rounded bg-danger-subtle px-2 py-1 text-xs text-danger dark:bg-danger-subtle dark:text-danger">
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
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-text-on-accent hover:bg-accent-hover disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        <button
          onClick={onCancel}
          disabled={isPending}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-surface dark:text-secondary dark:hover:bg-surface"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
