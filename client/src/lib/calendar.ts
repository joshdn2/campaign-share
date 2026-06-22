/**
 * calendar.ts
 *
 * Utility functions for custom campaign calendars. Handles conversion between
 * calendar dates (age + year + month + day) and absolute day indices, weekday
 * calculation, and date formatting.
 */

import type { CampaignCalendar, Node } from "../types";

export interface CalendarDateParts {
  ageId: string;
  year: number;
  monthId: string;
  day: number;
}

/**
 * Compute the number of days in a year for the given calendar.
 */
export function daysInYear(calendar: CampaignCalendar): number {
  return calendar.months.reduce((sum, month) => sum + month.days, 0);
}

/**
 * Compute the length of an age in years.
 *
 * If the age has no endYear, it is treated as infinitely long. Callers should
 * normally only ask for the length of ages that have ended.
 */
export function ageLengthYears(
  age: CampaignCalendar["ages"][number],
): number | null {
  if (age.endYear == null) return null;
  return age.endYear - age.startYear + 1;
}

/**
 * Convert a calendar date to an absolute day index from the start of the
 * calendar. Returns null if any required calendar component is missing.
 */
export function absoluteDayForDate(
  calendar: CampaignCalendar,
  date: CalendarDateParts | null | undefined,
): number | null {
  if (!date) return null;

  const age = calendar.ages.find((a) => a.id === date.ageId);
  const month = calendar.months.find((m) => m.id === date.monthId);
  if (!age || !month) return null;

  const ageIndex = calendar.ages.indexOf(age);
  const yearDays = daysInYear(calendar);

  let absoluteDay = 0;

  // Add all complete ages before this one.
  for (let i = 0; i < ageIndex; i++) {
    const previousAge = calendar.ages[i];
    const length = ageLengthYears(previousAge);
    if (length == null) return null;
    absoluteDay += length * yearDays;
  }

  // Add years within the current age.
  absoluteDay += (date.year - age.startYear) * yearDays;

  // Add months within the current year.
  const monthIndex = calendar.months.indexOf(month);
  for (let i = 0; i < monthIndex; i++) {
    absoluteDay += calendar.months[i].days;
  }

  // Add days within the current month.
  absoluteDay += date.day - 1;

  return absoluteDay;
}

/**
 * Convert an absolute day index back into a calendar date.
 */
export function dateForAbsoluteDay(
  calendar: CampaignCalendar,
  absoluteDay: number,
): CalendarDateParts | null {
  if (calendar.ages.length === 0 || calendar.months.length === 0) return null;

  const yearDays = daysInYear(calendar);
  let remaining = absoluteDay;

  for (const age of calendar.ages) {
    const length = ageLengthYears(age);
    const ageDays = length != null ? length * yearDays : Infinity;

    if (remaining < ageDays) {
      const year = age.startYear + Math.floor(remaining / yearDays);
      let yearRemaining = remaining % yearDays;

      for (const month of calendar.months) {
        if (yearRemaining < month.days) {
          return {
            ageId: age.id,
            year,
            monthId: month.id,
            day: yearRemaining + 1,
          };
        }
        yearRemaining -= month.days;
      }

      // Should not happen if months are well-formed.
      return null;
    }

    if (length == null) {
      // We're past the end of an infinite final age; clamp to its start.
      return {
        ageId: age.id,
        year: age.startYear,
        monthId: calendar.months[0].id,
        day: 1,
      };
    }

    remaining -= ageDays;
  }

  // Past the end of all defined ages; clamp to the last age's last day.
  const lastAge = calendar.ages[calendar.ages.length - 1];
  return {
    ageId: lastAge.id,
    year: lastAge.endYear ?? lastAge.startYear,
    monthId: calendar.months[calendar.months.length - 1].id,
    day: calendar.months[calendar.months.length - 1].days,
  };
}

/**
 * Compute the weekday name for a calendar date.
 */
export function weekdayForDate(
  calendar: CampaignCalendar,
  date: CalendarDateParts,
): string | null {
  if (
    !calendar.anchorAgeId ||
    !calendar.anchorMonthId ||
    calendar.anchorDay == null
  ) {
    return null;
  }

  const anchorDate: CalendarDateParts = {
    ageId: calendar.anchorAgeId,
    year: 0, // Anchor is assumed to be year 0 of its age for simplicity.
    monthId: calendar.anchorMonthId,
    day: calendar.anchorDay,
  };

  const anchorAge = calendar.ages.find((a) => a.id === calendar.anchorAgeId);
  if (anchorAge) {
    anchorDate.year = anchorAge.startYear;
  }

  const dateAbs = absoluteDayForDate(calendar, date);
  const anchorAbs = absoluteDayForDate(calendar, anchorDate);
  if (dateAbs == null || anchorAbs == null) return null;

  const diff = dateAbs - anchorAbs;
  const index =
    (((calendar.anchorWeekdayIndex + diff) % calendar.daysInWeek) +
      calendar.daysInWeek) %
    calendar.daysInWeek;

  return calendar.weekdayNames[index] ?? null;
}

/**
 * Format a calendar date for display.
 */
export function formatCalendarDate(
  calendar: CampaignCalendar,
  date: CalendarDateParts | null | undefined,
): string {
  if (!date) return "Unknown date";

  const age = calendar.ages.find((a) => a.id === date.ageId);
  const month = calendar.months.find((m) => m.id === date.monthId);
  if (!age || !month) return "Unknown date";

  return `${date.day} ${month.name}, ${date.year}, ${age.name}`;
}
export function formatCalendarDateNoAge(
  calendar: CampaignCalendar,
  date: CalendarDateParts | null | undefined,
): string {
  if (!date) return "Unknown date";

  const month = calendar.months.find((m) => m.id === date.monthId);
  if (!month) return "Unknown date";

  return `${date.day} ${month.name}, ${date.year}`;
}

/**
 * Find a sensible default date for a new session/event.
 *
 * Defaults to the end date of the most recent session. If none exists, falls
 * back to the first day of the first age/month.
 */
export function getDefaultCalendarDate(
  calendar: CampaignCalendar,
  sessions: Node[],
): CalendarDateParts {
  let latest: CalendarDateParts | null = null;
  let latestAbs = -1;

  for (const session of sessions) {
    if (session.type !== "SESSION" || !session.sessionDetail) continue;
    const endDate = session.sessionDetail.endDateMonthId
      ? {
          ageId: session.sessionDetail.endDateAgeId!,
          year: session.sessionDetail.endDateYear!,
          monthId: session.sessionDetail.endDateMonthId!,
          day: session.sessionDetail.endDateDay!,
        }
      : null;
    const abs = absoluteDayForDate(calendar, endDate);
    if (abs != null && abs > latestAbs) {
      latestAbs = abs;
      latest = endDate;
    }
  }

  if (latest) return latest;

  // Fallback to first age, year 0, first month, day 1.
  const firstAge = calendar.ages[0];
  const firstMonth = calendar.months[0];
  if (!firstAge || !firstMonth) {
    return { ageId: "", year: 0, monthId: "", day: 1 };
  }

  return {
    ageId: firstAge.id,
    year: firstAge.startYear,
    monthId: firstMonth.id,
    day: 1,
  };
}

/**
 * Build a map of absolute-day -> list of nodes for a given calendar and set of
 * dated nodes. Used by the calendar grid display.
 */
export function groupNodesByAbsoluteDay(
  calendar: CampaignCalendar,
  nodes: Node[],
  field: "startDate" | "endDate",
): Map<number, Node[]> {
  const map = new Map<number, Node[]>();

  for (const node of nodes) {
    if (node.type !== "SESSION" || !node.sessionDetail) continue;

    const detail = node.sessionDetail;
    const monthId =
      field === "startDate" ? detail.startDateMonthId : detail.endDateMonthId;
    if (!monthId) continue;

    const date: CalendarDateParts = {
      ageId:
        field === "startDate" ? detail.startDateAgeId! : detail.endDateAgeId!,
      year: field === "startDate" ? detail.startDateYear! : detail.endDateYear!,
      monthId,
      day: field === "startDate" ? detail.startDateDay! : detail.endDateDay!,
    };

    const abs = absoluteDayForDate(calendar, date);
    if (abs == null) continue;

    if (!map.has(abs)) map.set(abs, []);
    map.get(abs)!.push(node);
  }

  return map;
}
