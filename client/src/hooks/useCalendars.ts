/**
 * useCalendars.ts
 *
 * TanStack Query hooks for campaign calendar resources.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/axios";
import type { CampaignCalendar } from "../types";

const CALENDARS_KEY = "calendars";

/**
 * Fetches a campaign's custom calendar.
 *
 * @param campaignId - The campaign id.
 * @returns A TanStack Query result wrapping CampaignCalendar.
 *
 * Disabled until a truthy campaignId is provided.
 */
export function useCalendar(campaignId: string) {
  return useQuery({
    queryKey: [CALENDARS_KEY, campaignId],
    queryFn: async () => {
      const res = await api.get<CampaignCalendar>(`/campaigns/${campaignId}/calendar`);
      return res.data;
    },
    enabled: !!campaignId,
  });
}

/**
 * Creates or replaces a campaign's custom calendar.
 *
 * @param campaignId - The campaign id.
 * @returns A mutation accepting a full CampaignCalendar payload.
 *
 * On success it invalidates the campaign calendar query.
 */
export function useSaveCalendar(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      daysInWeek: number;
      weekdayNames: string[];
      anchorAgeId?: string;
      anchorMonthId?: string;
      anchorDay?: number;
      anchorWeekdayIndex: number;
      ages: Array<{
        id?: string;
        name: string;
        startYear: number;
        endYear?: number | null;
        order: number;
      }>;
      months: Array<{
        id?: string;
        name: string;
        days: number;
        order: number;
      }>;
      moons: Array<{
        id?: string;
        name: string;
        cycleLength: number;
        anchorAgeId?: string | null;
        anchorMonthId?: string | null;
        anchorDay?: number | null;
        order: number;
      }>;
    }) => {
      const res = await api.post<CampaignCalendar>(`/campaigns/${campaignId}/calendar`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CALENDARS_KEY, campaignId] });
    },
  });
}
