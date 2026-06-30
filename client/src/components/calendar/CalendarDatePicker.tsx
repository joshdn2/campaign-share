/**
 * CalendarDatePicker.tsx
 *
 * Four-field date picker for custom campaign calendars: age, year, month, day.
 * Year is a free-form number input so campaigns can span arbitrary ranges.
 *
 * The picker supports an unset/null state. When no date is set the fields are
 * disabled and a "Set date" button is shown. Once a date is set a "Clear"
 * button removes it.
 */

import type { CampaignCalendar, CalendarDate } from "../../types";

interface Props {
  calendar: CampaignCalendar;
  value: CalendarDate | null;
  onChange: (value: CalendarDate | null) => void;
  label?: string;
}

export function CalendarDatePicker({ calendar, value, onChange, label }: Props) {
  const month = calendar.months.find((m) => m.id === value?.monthId);
  const maxDay = month?.days ?? 31;

  const safeValue = value ?? {
    ageId: calendar.ages[0]?.id ?? "",
    year: calendar.ages[0]?.startYear ?? 0,
    monthId: calendar.months[0]?.id ?? "",
    day: 1,
  };

  const handleChange = (field: keyof CalendarDate, newValue: string | number) => {
    const next = { ...safeValue, [field]: newValue };
    if (field === "monthId") {
      const selectedMonth = calendar.months.find((m) => m.id === newValue);
      if (selectedMonth && safeValue.day > selectedMonth.days) {
        next.day = selectedMonth.days;
      }
    }
    onChange(next);
  };

  const selectClass =
    "rounded border border-default px-1.5 py-1 text-xs dark:border-default dark:bg-surface dark:text-primary disabled:opacity-50";
  const inputClass =
    "rounded border border-default px-1.5 py-1 text-xs dark:border-default dark:bg-surface dark:text-primary disabled:opacity-50";
  const labelClass = "block text-[10px] font-medium text-muted dark:text-secondary";

  return (
    <div>
      {label && (
        <label className="mb-1 block text-sm font-medium text-primary dark:text-secondary">
          {label}
        </label>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-wrap gap-2">
          <div className="flex flex-col gap-0.5">
            <span className={labelClass}>Age</span>
            <select
              value={safeValue.ageId}
              onChange={(e) => handleChange("ageId", e.target.value)}
              disabled={value == null}
              className={selectClass}
            >
              {calendar.ages.map((age) => (
                <option key={age.id} value={age.id}>
                  {age.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className={labelClass}>Year</span>
            <input
              type="number"
              min={0}
              value={safeValue.year}
              onChange={(e) => handleChange("year", Number(e.target.value))}
              disabled={value == null}
              className={`${inputClass} w-16`}
            />
          </div>

          <div className="flex flex-col gap-0.5">
            <span className={labelClass}>Month</span>
            <select
              value={safeValue.monthId}
              onChange={(e) => handleChange("monthId", e.target.value)}
              disabled={value == null}
              className={selectClass}
            >
              {calendar.months.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className={labelClass}>Day</span>
            <input
              type="number"
              min={1}
              max={maxDay}
              value={safeValue.day}
              onChange={(e) => handleChange("day", Number(e.target.value))}
              disabled={value == null}
              className={`${inputClass} w-14`}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onChange(value == null ? safeValue : null)}
          className="rounded border border-default px-2 py-1 text-xs text-muted hover:bg-surface dark:border-default dark:text-secondary dark:hover:bg-surface"
        >
          {value == null ? "Set date" : "Clear"}
        </button>
      </div>
    </div>
  );
}
