/**
 * CalendarEditModal.tsx
 *
 * Modal for creating or editing a campaign's custom calendar. DM or LOREMASTER
 * users can define ages, months, weekday names, and a weekday anchor.
 */

import { useState } from "react";
import type { CampaignCalendar } from "../../types";

interface Props {
  calendar: CampaignCalendar | null;
  campaignId: string;
  onSave: (data: {
    name: string;
    daysInWeek: number;
    weekdayNames: string[];
    anchorAgeId?: string;
    anchorMonthId?: string;
    anchorDay?: number;
    anchorWeekdayIndex: number;
    ages: CampaignCalendar["ages"];
    months: CampaignCalendar["months"];
    moons: CampaignCalendar["moons"];
  }) => Promise<void>;
  onClose: () => void;
  isPending: boolean;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path
        fillRule="evenodd"
        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function CalendarEditModal({ calendar, onSave, onClose, isPending }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(calendar?.name ?? "");
  const [daysInWeek, setDaysInWeek] = useState(calendar?.daysInWeek ?? 7);
  const [weekdayNames, setWeekdayNames] = useState<string[]>(
    calendar?.weekdayNames?.length
      ? calendar.weekdayNames
      : Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`),
  );

  const [ages, setAges] = useState<CampaignCalendar["ages"]>(calendar?.ages ?? []);
  const [months, setMonths] = useState<CampaignCalendar["months"]>(calendar?.months ?? []);

  const [anchorAgeId, setAnchorAgeId] = useState<string | undefined>(
    calendar?.anchorAgeId ?? undefined,
  );
  const [anchorMonthId, setAnchorMonthId] = useState<string | undefined>(
    calendar?.anchorMonthId ?? undefined,
  );
  const [anchorDay, setAnchorDay] = useState<number | undefined>(
    calendar?.anchorDay ?? undefined,
  );
  const [anchorWeekdayIndex, setAnchorWeekdayIndex] = useState(
    calendar?.anchorWeekdayIndex ?? 0,
  );

  const handleDaysInWeekChange = (value: number) => {
    const clamped = Math.min(Math.max(value, 1), 31);
    setDaysInWeek(clamped);
    setWeekdayNames((prev) => {
      const next: string[] = [];
      for (let i = 0; i < clamped; i++) {
        next.push(prev[i] ?? `Day ${i + 1}`);
      }
      return next;
    });
    setAnchorWeekdayIndex((prev) => Math.min(prev, clamped - 1));
  };

  const handleAddAge = () => {
    setAges((prev) => [
      ...prev,
      {
        id: generateId(),
        calendarId: "",
        name: "",
        startYear: 0,
        endYear: null,
        order: prev.length,
      },
    ]);
  };

  const handleUpdateAge = (index: number, data: Partial<CampaignCalendar["ages"][number]>) => {
    setAges((prev) => prev.map((age, i) => (i === index ? { ...age, ...data } : age)));
  };

  const handleRemoveAge = (index: number) => {
    setAges((prev) => prev.filter((_, i) => i !== index).map((age, i) => ({ ...age, order: i })));
  };

  const handleAddMonth = () => {
    setMonths((prev) => [
      ...prev,
      {
        id: generateId(),
        calendarId: "",
        name: "",
        days: 30,
        order: prev.length,
      },
    ]);
  };

  const handleUpdateMonth = (index: number, data: Partial<CampaignCalendar["months"][number]>) => {
    setMonths((prev) => prev.map((month, i) => (i === index ? { ...month, ...data } : month)));
  };

  const handleRemoveMonth = (index: number) => {
    setMonths((prev) =>
      prev.filter((_, i) => i !== index).map((month, i) => ({ ...month, order: i })),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onSave({
        name,
        daysInWeek,
        weekdayNames,
        anchorAgeId,
        anchorMonthId,
        anchorDay,
        anchorWeekdayIndex,
        ages,
        months,
        moons: [],
      });
      onClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string | Record<string, unknown> } } })?.response?.data
          ?.error ?? "Failed to save calendar. Please try again.";
      setError(typeof message === "string" ? message : "Failed to save calendar. Please try again.");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-default px-2 py-1.5 text-sm dark:border-default dark:bg-surface dark:text-primary";
  const numberClass =
    "rounded-lg border border-default px-2 py-1.5 text-sm dark:border-default dark:bg-surface dark:text-primary";
  const labelClass = "mb-1 block text-xs font-medium text-muted dark:text-secondary";
  const iconButtonClass =
    "rounded-lg p-1.5 text-muted hover:bg-surface dark:text-secondary dark:hover:bg-surface";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-card-bg p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-primary">
          {calendar ? "Edit Calendar" : "Create Calendar"}
        </h2>
        {error && (
          <div className="mb-4 rounded-lg bg-danger-subtle p-3 text-sm text-danger dark:bg-danger-subtle dark:text-danger">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Calendar name */}
          <div>
            <label className={labelClass}>Calendar Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          {/* Ages */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-primary">Ages</h3>
              <button
                type="button"
                onClick={handleAddAge}
                className="rounded-lg bg-accent px-2.5 py-1 text-sm font-medium text-text-on-accent hover:bg-accent-hover"
              >
                + Add Age
              </button>
            </div>
            {ages.length === 0 && (
              <p className="text-sm text-muted dark:text-secondary">No ages added yet.</p>
            )}
            <div className="space-y-2">
              {ages.map((age, index) => (
                <div key={age.id} className="grid grid-cols-1 items-end gap-2 sm:grid-cols-4">
                  <div>
                    <label className={labelClass}>Name</label>
                    <input
                      type="text"
                      value={age.name}
                      onChange={(e) => handleUpdateAge(index, { name: e.target.value })}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Start Year</label>
                    <input
                      type="number"
                      value={age.startYear}
                      onChange={(e) => handleUpdateAge(index, { startYear: Number(e.target.value) })}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>End Year (optional)</label>
                    <input
                      type="number"
                      placeholder="Open ended"
                      value={age.endYear ?? ""}
                      onChange={(e) =>
                        handleUpdateAge(index, {
                          endYear: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveAge(index)}
                      className={iconButtonClass}
                      aria-label="Remove age"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Months */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-primary">Months</h3>
              <button
                type="button"
                onClick={handleAddMonth}
                className="rounded-lg bg-accent px-2.5 py-1 text-sm font-medium text-text-on-accent hover:bg-accent-hover"
              >
                + Add Month
              </button>
            </div>
            {months.length === 0 && (
              <p className="text-sm text-muted dark:text-secondary">No months added yet.</p>
            )}
            <div className="space-y-2">
              {months.map((month, index) => (
                <div key={month.id} className="grid grid-cols-1 items-end gap-2 sm:grid-cols-3">
                  <div>
                    <label className={labelClass}>Name</label>
                    <input
                      type="text"
                      value={month.name}
                      onChange={(e) => handleUpdateMonth(index, { name: e.target.value })}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Days</label>
                    <input
                      type="number"
                      min={1}
                      value={month.days}
                      onChange={(e) => handleUpdateMonth(index, { days: Number(e.target.value) })}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveMonth(index)}
                      className={iconButtonClass}
                      aria-label="Remove month"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Days in week */}
          <div>
            <label className={labelClass}>Days in Week</label>
            <input
              type="number"
              min={1}
              max={31}
              value={daysInWeek}
              onChange={(e) => handleDaysInWeekChange(Number(e.target.value))}
              required
              className={`${numberClass} w-24`}
            />
          </div>

          {/* Weekday names */}
          <div>
            <label className={labelClass}>Weekday Names</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
              {weekdayNames.map((name, i) => (
                <input
                  key={i}
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const next = [...weekdayNames];
                    next[i] = e.target.value;
                    setWeekdayNames(next);
                  }}
                  required
                  className={inputClass}
                />
              ))}
            </div>
          </div>

          {/* Anchor date */}
          <div className="rounded-lg border border-transparent bg-item-bg p-4">
            <h3 className="mb-1 text-sm font-semibold text-primary">
              Weekday Anchor
            </h3>
            <p className="mb-3 text-xs text-muted dark:text-secondary">
              Pick a date you know falls on a specific weekday. The calendar uses this to
              calculate weekdays for every other date.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div>
                <label className={labelClass}>Age</label>
                <select
                  value={anchorAgeId ?? ""}
                  onChange={(e) => setAnchorAgeId(e.target.value || undefined)}
                  className={inputClass}
                >
                  <option value="">Select age</option>
                  {ages.map((age) => (
                    <option key={age.id} value={age.id}>
                      {age.name || "Untitled age"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Month</label>
                <select
                  value={anchorMonthId ?? ""}
                  onChange={(e) => setAnchorMonthId(e.target.value || undefined)}
                  className={inputClass}
                >
                  <option value="">Select month</option>
                  {months.map((month) => (
                    <option key={month.id} value={month.id}>
                      {month.name || "Untitled month"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Day</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Day"
                  value={anchorDay ?? ""}
                  onChange={(e) => setAnchorDay(Number(e.target.value) || undefined)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Weekday</label>
                <select
                  value={anchorWeekdayIndex}
                  onChange={(e) => setAnchorWeekdayIndex(Number(e.target.value))}
                  className={inputClass}
                >
                  {weekdayNames.map((name, i) => (
                    <option key={i} value={i}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

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
              {isPending ? "Saving..." : "Save Calendar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
