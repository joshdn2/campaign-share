/**
 * CalendarCard.tsx
 *
 * Compact block-style calendar card displayed on the campaign landing page.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCalendar } from "../../hooks/useCalendars";
import { useCampaignNodes } from "../../hooks/useNodes";
import {
  absoluteDayForDate,
  dateForAbsoluteDay,
  daysInYear,
  groupNodesByAbsoluteDay,
  weekdayForDate,
} from "../../lib/calendar";

interface Props {
  campaignId: string;
  isDm: boolean;
  isLoremaster: boolean;
  onEditCalendar: () => void;
}

export function CalendarCard({ campaignId, isDm, isLoremaster, onEditCalendar }: Props) {
  const navigate = useNavigate();
  const { data: calendar, isLoading: calendarLoading } = useCalendar(campaignId);
  const { data: nodes, isLoading: nodesLoading } = useCampaignNodes(campaignId);

  const sessions = useMemo(
    () => (nodes ?? []).filter((n) => n.type === "SESSION"),
    [nodes],
  );

  const [selectedAbsDay, setSelectedAbsDay] = useState<number | null>(null);
  const [showAgeDropdown, setShowAgeDropdown] = useState(false);

  const presentDate = useMemo(() => {
    if (!calendar) return null;

    let latestAbs = -1;
    let latestDate = null;
    for (const session of sessions) {
      if (!session.sessionDetail?.endDateMonthId) continue;
      const date = {
        ageId: session.sessionDetail.endDateAgeId!,
        year: session.sessionDetail.endDateYear!,
        monthId: session.sessionDetail.endDateMonthId!,
        day: session.sessionDetail.endDateDay!,
      };
      const abs = absoluteDayForDate(calendar, date);
      if (abs != null && abs > latestAbs) {
        latestAbs = abs;
        latestDate = date;
      }
    }
    return latestDate;
  }, [calendar, sessions]);

  const defaultView = useMemo(() => {
    if (!calendar) return null;
    return presentDate ?? {
      ageId: calendar.ages[0]?.id ?? "",
      year: calendar.ages[0]?.startYear ?? 0,
      monthId: calendar.months[0]?.id ?? "",
      day: 1,
    };
  }, [calendar, presentDate]);

  const [viewDate, setViewDate] = useState(() => defaultView);

  if (viewDate == null && defaultView != null) {
    setViewDate(defaultView);
  }

  const canManageCalendar = isDm || isLoremaster;

  if (calendarLoading || nodesLoading) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900">
        Loading calendar...
      </section>
    );
  }

  if (!calendar) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-800 dark:text-white">Calendar</span>
          {canManageCalendar && (
            <button
              onClick={onEditCalendar}
              className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              Create
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          No calendar has been created yet.
        </p>
      </section>
    );
  }

  if (!viewDate) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-3 text-xs dark:border-gray-700 dark:bg-gray-900">
        Calendar has no ages or months.
      </section>
    );
  }

  const currentAge = calendar.ages.find((a) => a.id === viewDate.ageId);
  const currentMonth = calendar.months.find((m) => m.id === viewDate.monthId);
  if (!currentAge || !currentMonth) return null;

  const firstOfMonth: ReturnType<typeof dateForAbsoluteDay> = {
    ageId: viewDate.ageId,
    year: viewDate.year,
    monthId: viewDate.monthId,
    day: 1,
  };
  const firstOfMonthAbs = absoluteDayForDate(calendar, firstOfMonth);
  const startWeekday =
    firstOfMonthAbs != null ? weekdayForDate(calendar, firstOfMonth) : null;
  const startWeekdayIndex = startWeekday
    ? Math.max(0, calendar.weekdayNames.indexOf(startWeekday))
    : 0;

  const allSessionDays = useMemo(() => {
    const starts = groupNodesByAbsoluteDay(calendar, sessions, "startDate");
    const ends = groupNodesByAbsoluteDay(calendar, sessions, "endDate");
    const days = new Set<number>();
    starts.forEach((_, abs) => days.add(abs));
    ends.forEach((_, abs) => days.add(abs));
    return days;
  }, [calendar, sessions]);

  const selectedSessions = selectedAbsDay != null
    ? [
        ...(groupNodesByAbsoluteDay(calendar, sessions, "startDate").get(selectedAbsDay) ?? []),
        ...(groupNodesByAbsoluteDay(calendar, sessions, "endDate").get(selectedAbsDay) ?? []),
      ]
    : [];

  const handlePrevMonth = () => {
    const prevAbs = (firstOfMonthAbs ?? 0) - 1;
    const prevDate = dateForAbsoluteDay(calendar, prevAbs);
    if (prevDate) {
      setViewDate(prevDate);
      setSelectedAbsDay(null);
    }
  };

  const handleNextMonth = () => {
    const nextAbs = (firstOfMonthAbs ?? 0) + currentMonth.days;
    const nextDate = dateForAbsoluteDay(calendar, nextAbs);
    if (nextDate) {
      setViewDate(nextDate);
      setSelectedAbsDay(null);
    }
  };

  const handlePrevYear = () => {
    const prevYearAbs = (firstOfMonthAbs ?? 0) - daysInYear(calendar);
    const prevDate = dateForAbsoluteDay(calendar, prevYearAbs);
    if (prevDate) {
      setViewDate(prevDate);
      setSelectedAbsDay(null);
    }
  };

  const handleNextYear = () => {
    const nextYearAbs = (firstOfMonthAbs ?? 0) + daysInYear(calendar);
    const nextDate = dateForAbsoluteDay(calendar, nextYearAbs);
    if (nextDate) {
      setViewDate(nextDate);
      setSelectedAbsDay(null);
    }
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800 dark:text-white">
            {calendar.name}
          </span>

          <div className="relative">
            <button
              onClick={() => setShowAgeDropdown((v) => !v)}
              className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {currentAge.name} ▾
            </button>
            {showAgeDropdown && (
              <div className="absolute left-0 top-full z-10 mt-1 min-w-[8rem] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                {calendar.ages.map((age) => (
                  <button
                    key={age.id}
                    onClick={() => {
                      setViewDate({
                        ageId: age.id,
                        year: age.startYear,
                        monthId: viewDate.monthId,
                        day: 1,
                      });
                      setSelectedAbsDay(null);
                      setShowAgeDropdown(false);
                    }}
                    className={`block w-full px-3 py-1 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-800 ${
                      age.id === currentAge.id
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {age.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {canManageCalendar && (
          <button
            onClick={onEditCalendar}
            className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
          >
            Edit
          </button>
        )}
      </div>

      <div className="mb-2 flex items-center justify-center gap-1">
        <button
          onClick={handlePrevYear}
          className="rounded px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          ‹‹
        </button>
        <button
          onClick={handlePrevMonth}
          className="rounded px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          ‹
        </button>
        <span className="min-w-[6rem] text-center text-sm font-semibold text-gray-800 dark:text-white">
          {currentMonth.name} {viewDate.year}
        </span>
        <button
          onClick={handleNextMonth}
          className="rounded px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          ›
        </button>
        <button
          onClick={handleNextYear}
          className="rounded px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          ››
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {/* Calendar grid */}
        <div className="w-full max-w-5xl">
          <div
            className="grid gap-px rounded border border-gray-200 bg-gray-200 dark:border-gray-700 dark:bg-gray-700"
            style={{ gridTemplateColumns: `repeat(${calendar.daysInWeek}, minmax(3rem, 1fr))` }}
          >
            {calendar.weekdayNames.map((name) => (
              <div
                key={name}
                className="min-w-0 bg-white p-1 text-center text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400"
              >
                <span className="block truncate">{name}</span>
              </div>
            ))}

            {Array.from({ length: startWeekdayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8 bg-gray-50 dark:bg-gray-900/50" />
            ))}

            {Array.from({ length: currentMonth.days }).map((_, dayIndex) => {
              const day = dayIndex + 1;
              const dateAbs = (firstOfMonthAbs ?? 0) + dayIndex;
              const hasSession = allSessionDays.has(dateAbs);
              const isSelected = selectedAbsDay === dateAbs;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedAbsDay(isSelected ? null : dateAbs)}
                  className={`flex h-8 items-center justify-center bg-white text-sm transition-colors dark:bg-gray-900 ${
                    isSelected
                      ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  } ${hasSession ? "border-b-2 border-blue-500 font-semibold" : ""}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day detail */}
        <div className="min-w-[11rem] rounded border border-gray-200 p-2 dark:border-gray-700">
          {selectedAbsDay != null ? (
            <>
              <h3 className="mb-1 text-xs font-semibold text-gray-800 dark:text-white">
                {(() => {
                  const date = dateForAbsoluteDay(calendar, selectedAbsDay);
                  if (!date) return "Unknown date";
                  const age = calendar.ages.find((a) => a.id === date.ageId);
                  const month = calendar.months.find((m) => m.id === date.monthId);
                  if (!age || !month) return "Unknown date";
                  return `${age.name}: ${date.day} ${month.name}, Year ${date.year}`;
                })()}
              </h3>
              {selectedSessions.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">No sessions.</p>
              ) : (
                <ul className="space-y-1">
                  {selectedSessions.map((session) => (
                    <li key={session.id}>
                      <button
                        onClick={() => navigate(`/campaigns/${campaignId}/nodes/${session.id}`)}
                        className="text-left text-xs text-blue-700 hover:underline dark:text-blue-300"
                      >
                        {session.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Click a day to see sessions.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
