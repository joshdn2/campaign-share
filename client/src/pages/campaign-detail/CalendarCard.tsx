/**
 * CalendarCard.tsx
 *
 * Compact block-style calendar card displayed on the campaign landing page.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCalendar } from "../../hooks/useCalendars";
import { useCampaignNodes } from "../../hooks/useNodes";
import {
  absoluteDayForDate,
  ageStartYear,
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
      year: calendar.ages[0] ? ageStartYear(calendar.ages[0]) : 0,
      monthId: calendar.months[0]?.id ?? "",
      day: 1,
    };
  }, [calendar, presentDate]);

  const [viewDate, setViewDate] = useState(() => defaultView);

  useEffect(() => {
    if (viewDate == null && defaultView != null) {
      setViewDate(defaultView);
    }
  }, [viewDate, defaultView]);

  const canManageCalendar = isDm || isLoremaster;

  const allSessionDays = useMemo(() => {
    if (!calendar) return new Set<number>();
    const starts = groupNodesByAbsoluteDay(calendar, sessions, "startDate");
    const ends = groupNodesByAbsoluteDay(calendar, sessions, "endDate");
    const days = new Set<number>();
    starts.forEach((_, abs) => days.add(abs));
    ends.forEach((_, abs) => days.add(abs));
    return days;
  }, [calendar, sessions]);

  const selectedSessions = useMemo(() => {
    if (selectedAbsDay == null || !calendar) return [];
    return [
      ...(groupNodesByAbsoluteDay(calendar, sessions, "startDate").get(selectedAbsDay) ?? []),
      ...(groupNodesByAbsoluteDay(calendar, sessions, "endDate").get(selectedAbsDay) ?? []),
    ];
  }, [calendar, selectedAbsDay, sessions]);

  if (calendarLoading || nodesLoading) {
    return (
      <section className="rounded-lg border border-transparent bg-accent-subtle p-3 text-sm">
        Loading calendar...
      </section>
    );
  }

  if (!calendar) {
    return (
      <section className="rounded-lg border border-transparent bg-accent-subtle p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-primary">Calendar</span>
          {canManageCalendar && (
            <button
              onClick={onEditCalendar}
              className="rounded bg-accent px-2 py-1 text-xs font-medium text-text-on-accent hover:bg-accent-hover"
            >
              Create
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-muted dark:text-secondary">
          No calendar has been created yet.
        </p>
      </section>
    );
  }

  if (!viewDate) {
    return (
      <section className="rounded-lg border border-transparent bg-accent-subtle p-3 text-xs">
        Calendar has no ages or months.
      </section>
    );
  }

  const currentAge = calendar.ages.find((a) => a.id === viewDate.ageId);
  const currentMonth = calendar.months.find((m) => m.id === viewDate.monthId);
  if (!currentAge || !currentMonth) return null;

  const compactCalendar = calendar.daysInWeek > 7;
  const colMinWidth = compactCalendar ? "1.75rem" : "3rem";
  const headerPadding = compactCalendar ? "px-0.5 py-px" : "p-1";
  const headerTextSize = compactCalendar ? "text-[10px]" : "text-xs";
  const dayCellHeight = compactCalendar ? "h-7" : "h-8";
  const dayCellText = compactCalendar ? "text-xs" : "text-sm";

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
    <section className="rounded-lg border border-transparent bg-accent-subtle p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">
            {calendar.name}
          </span>

          <div className="relative">
            <button
              onClick={() => setShowAgeDropdown((v) => !v)}
              className="rounded border border-default px-2 py-0.5 text-xs text-muted hover:bg-surface dark:border-default dark:text-secondary dark:hover:bg-surface"
            >
              {currentAge.name} <span className="text-accent">▾</span>
            </button>
            {showAgeDropdown && (
              <div className="absolute left-0 top-full z-10 mt-1 min-w-[8rem] rounded-lg border border-default bg-elevated py-1 shadow-lg dark:border-default dark:bg-elevated">
                {calendar.ages.map((age) => (
                  <button
                    key={age.id}
                    onClick={() => {
                      setViewDate({
                        ageId: age.id,
                        year: ageStartYear(age),
                        monthId: viewDate.monthId,
                        day: 1,
                      });
                      setSelectedAbsDay(null);
                      setShowAgeDropdown(false);
                    }}
                    className={`block w-full px-3 py-1 text-left text-xs hover:bg-surface dark:hover:bg-surface ${
                      age.id === currentAge.id
                        ? "bg-accent-subtle text-accent dark:bg-accent-subtle dark:text-accent"
                        : "text-primary dark:text-secondary"
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
            className="rounded bg-accent px-2 py-1 text-xs font-medium text-text-on-accent hover:bg-accent-hover"
          >
            Edit
          </button>
        )}
      </div>

      <div className="mb-2 flex items-center justify-center gap-1">
        <button
          onClick={handlePrevYear}
          className="rounded px-2 py-1 text-sm font-medium text-accent hover:bg-accent-subtle"
        >
          ‹‹
        </button>
        <button
          onClick={handlePrevMonth}
          className="rounded px-2 py-1 text-sm font-medium text-accent hover:bg-accent-subtle"
        >
          ‹
        </button>
        <span className="min-w-[6rem] text-center text-sm font-semibold text-primary">
          {currentMonth.name} {viewDate.year}
        </span>
        <button
          onClick={handleNextMonth}
          className="rounded px-2 py-1 text-sm font-medium text-accent hover:bg-accent-subtle"
        >
          ›
        </button>
        <button
          onClick={handleNextYear}
          className="rounded px-2 py-1 text-sm font-medium text-accent hover:bg-accent-subtle"
        >
          ››
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {/* Calendar grid */}
        <div className="w-full max-w-5xl overflow-x-auto">
          <div
            className="grid min-w-max gap-px rounded border border-default bg-surface dark:border-default dark:bg-surface"
            style={{
              gridTemplateColumns: `repeat(${calendar.daysInWeek}, minmax(${colMinWidth}, 1fr))`,
            }}
          >
            {calendar.weekdayNames.map((name) => (
              <div
                key={name}
                className={`min-w-0 bg-elevated text-center font-medium text-muted dark:bg-elevated dark:text-secondary ${headerPadding} ${headerTextSize}`}
              >
                {compactCalendar ? (
                  <span className="block truncate">{name.slice(0, 2)}</span>
                ) : (
                  <>
                    <span className="block truncate sm:hidden">
                      {name.slice(0, 2)}
                    </span>
                    <span className="hidden truncate sm:block">{name}</span>
                  </>
                )}
              </div>
            ))}

            {Array.from({ length: startWeekdayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className={`${dayCellHeight} bg-surface dark:bg-elevated`} />
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
                  className={`flex ${dayCellHeight} ${dayCellText} items-center justify-center bg-elevated transition-colors dark:bg-elevated ${
                    isSelected
                      ? "bg-accent-subtle font-semibold text-accent ring-1 ring-inset ring-accent dark:bg-accent-subtle dark:text-accent dark:ring-accent"
                      : "text-primary hover:bg-surface dark:text-secondary dark:hover:bg-surface"
                  } ${hasSession ? "border-b-2 border-accent font-semibold" : ""}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day detail */}
        <div className="min-w-[11rem] rounded border border-transparent bg-item-bg p-2">
          {selectedAbsDay != null ? (
            <>
              <h3 className="mb-1 text-xs font-semibold text-primary">
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
                <p className="text-xs text-muted dark:text-secondary">No sessions.</p>
              ) : (
                <ul className="space-y-1">
                  {selectedSessions.map((session) => (
                    <li key={session.id}>
                      <button
                        onClick={() => navigate(`/campaigns/${campaignId}/nodes/${session.id}`)}
                        className="text-left text-xs text-accent hover:underline dark:text-accent"
                      >
                        {session.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-xs text-muted dark:text-secondary">
              Click a day to see sessions.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
