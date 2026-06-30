import { useState } from "react";
import type { Node, CalendarDate, CampaignCalendar } from "../../../types";
import { useCalendar } from "../../../hooks/useCalendars";
import { useUpdateNode } from "../../../hooks/useNodes";
import { CalendarDatePicker } from "../../../components/calendar/CalendarDatePicker";
import {
  absoluteDayForDate,
  formatCalendarDate,
  formatCalendarDateNoAge,
} from "../../../lib/calendar";
import type { DetailSectionProps } from "../NodeDetailsAndLinks";
import { TextArea } from "./DetailFields";

/**
 * ============================================================================
 * node-detail/sections/SessionDetails.tsx
 * ============================================================================
 *
 * Detail section for SESSION nodes. Displays the session number, in-world dates,
 * real-world date, description, and summaries. Users with permission can toggle
 * edit mode to update the fields.
 */

function toCalendarDate(
  detail: Node["sessionDetail"],
  field: "startDate" | "endDate",
): CalendarDate | null {
  if (!detail) return null;
  const ageId = field === "startDate" ? detail.startDateAgeId : detail.endDateAgeId;
  const year = field === "startDate" ? detail.startDateYear : detail.endDateYear;
  const monthId = field === "startDate" ? detail.startDateMonthId : detail.endDateMonthId;
  const day = field === "startDate" ? detail.startDateDay : detail.endDateDay;
  if (!ageId || year == null || !monthId || day == null) return null;
  return { ageId, year, monthId, day };
}

function toDateInputValue(date: string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export function SessionDetails({ node, isEditing, onDone }: DetailSectionProps) {
  const campaignId = node.campaignId ?? "";
  const { data: calendar } = useCalendar(campaignId);

  const startDate = toCalendarDate(node.sessionDetail, "startDate");
  const endDate = toCalendarDate(node.sessionDetail, "endDate");

  if (isEditing) {
    if (!calendar) {
      return (
        <p className="text-sm text-muted dark:text-secondary">
          Loading calendar...
        </p>
      );
    }
    return (
      <SessionEditForm
        node={node}
        calendar={calendar}
        onDone={onDone}
      />
    );
  }

  return (
    <div className="space-y-3 text-sm text-muted dark:text-secondary">
      {/* Header row: session number and dates */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {node.sessionDetail && (
          <span className="font-semibold text-primary">
            Session #{node.sessionDetail.sessionNumber}
          </span>
        )}

        {calendar && (
          <span>
            <span className="font-medium">Date:</span>{" "}
            {formatCalendarDateNoAge(calendar, startDate)} -{" "}
            {formatCalendarDate(calendar, endDate)}
          </span>
        )}
      </div>

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

interface SessionEditFormProps {
  node: Node;
  calendar: CampaignCalendar;
  onDone: () => void;
}

type SessionForm = {
  startDate: CalendarDate | null;
  endDate: CalendarDate | null;
  sessionDate: string;
  shortSummary: string;
  longSummary: string;
  excerpt: string;
};

function SessionEditForm({ node, calendar, onDone }: SessionEditFormProps) {
  const updateNode = useUpdateNode(node.id);
  const [form, setForm] = useState<SessionForm>(() => ({
    startDate: toCalendarDate(node.sessionDetail, "startDate"),
    endDate: toCalendarDate(node.sessionDetail, "endDate"),
    sessionDate: toDateInputValue(node.sessionDetail?.sessionDate),
    shortSummary: node.sessionDetail?.shortSummary ?? "",
    longSummary: node.sessionDetail?.longSummary ?? "",
    excerpt: node.excerpt ?? "",
  }));
  const [dateError, setDateError] = useState<string | null>(null);

  const handleStartDateChange = (value: CalendarDate | null) => {
    setDateError(null);
    setForm((f) => {
      if (value == null) {
        return { ...f, startDate: null };
      }
      if (f.endDate == null) {
        return { ...f, startDate: value, endDate: value };
      }
      const startAbs = absoluteDayForDate(calendar, value);
      const endAbs = absoluteDayForDate(calendar, f.endDate);
      if (startAbs != null && endAbs != null && endAbs < startAbs) {
        return { ...f, startDate: value, endDate: value };
      }
      return { ...f, startDate: value };
    });
  };

  const handleEndDateChange = (value: CalendarDate | null) => {
    setDateError(null);
    setForm((f) => ({ ...f, endDate: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setDateError(null);

    if (form.endDate != null && form.startDate == null) {
      setDateError("A start date is required when an end date is set.");
      return;
    }

    if (form.startDate && form.endDate) {
      const startAbs = absoluteDayForDate(calendar, form.startDate);
      const endAbs = absoluteDayForDate(calendar, form.endDate);
      if (startAbs != null && endAbs != null && endAbs < startAbs) {
        setDateError("End date cannot be before the start date.");
        return;
      }
    }

    await updateNode.mutateAsync({
      excerpt: form.excerpt || null,
      details: {
        startDateAgeId: form.startDate?.ageId ?? null,
        startDateYear: form.startDate?.year ?? null,
        startDateMonthId: form.startDate?.monthId ?? null,
        startDateDay: form.startDate?.day ?? null,
        endDateAgeId: form.endDate?.ageId ?? null,
        endDateYear: form.endDate?.year ?? null,
        endDateMonthId: form.endDate?.monthId ?? null,
        endDateDay: form.endDate?.day ?? null,
        sessionDate: form.sessionDate ? new Date(form.sessionDate).toISOString() : null,
        shortSummary: form.shortSummary || null,
        longSummary: form.longSummary || null,
      },
    });
    onDone();
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="space-y-4 rounded-lg border border-transparent bg-item-bg p-3 text-sm text-muted dark:text-secondary">
        {dateError && (
          <p className="rounded bg-danger-subtle px-2 py-1 text-xs text-danger dark:bg-danger-subtle dark:text-danger">
            {dateError}
          </p>
        )}
        <CalendarDatePicker
          calendar={calendar}
          value={form.startDate}
          onChange={handleStartDateChange}
          label="Start Date"
        />
        <CalendarDatePicker
          calendar={calendar}
          value={form.endDate}
          onChange={handleEndDateChange}
          label="End Date"
        />
        <div>
          <label className="mb-1 block text-xs font-medium text-primary dark:text-secondary">
            Real-World Date
          </label>
          <input
            type="date"
            value={form.sessionDate}
            onChange={(e) => setForm((f) => ({ ...f, sessionDate: e.target.value }))}
            className="w-full rounded-lg border border-default px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-default dark:bg-surface dark:text-primary"
          />
        </div>
        <TextArea label="Description" value={form.excerpt} onChange={(v) => setForm((f) => ({ ...f, excerpt: v }))} />
        <TextArea label="Short Summary" value={form.shortSummary} onChange={(v) => setForm((f) => ({ ...f, shortSummary: v }))} />
        <TextArea label="Long Summary" value={form.longSummary} onChange={(v) => setForm((f) => ({ ...f, longSummary: v }))} rows={6} />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={updateNode.isPending}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-text-on-accent hover:bg-accent-hover disabled:opacity-50"
        >
          {updateNode.isPending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={updateNode.isPending}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-surface dark:text-secondary dark:hover:bg-surface"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
