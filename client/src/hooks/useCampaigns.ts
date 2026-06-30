/**
 * useCampaigns.ts
 *
 * TanStack Query hooks for campaign data. Includes fetching the user's
 * campaign list, individual campaigns, and mutations for CRUD and member
 * management. Cache invalidation keeps the list and detail views in sync.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/axios";
import type { Campaign, CampaignMember } from "../types";

// Shared root query key for all campaign queries.
const CAMPAIGNS_KEY = "campaigns";

/**
 * Fetches the list of campaigns the current user belongs to.
 *
 * @returns A TanStack Query result wrapping Campaign[].
 */
export function useMyCampaigns() {
  return useQuery({
    queryKey: [CAMPAIGNS_KEY],
    queryFn: async () => {
      const res = await api.get<Campaign[]>("/campaigns/my");
      return res.data;
    },
  });
}

/**
 * Fetches a single campaign by id.
 *
 * @param id - Campaign id.
 * @returns A TanStack Query result wrapping Campaign.
 *
 * Disabled until a truthy id is provided.
 */
export function useCampaign(id: string) {
  return useQuery({
    queryKey: [CAMPAIGNS_KEY, id],
    queryFn: async () => {
      const res = await api.get<Campaign>(`/campaigns/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

/**
 * Creates a new campaign.
 *
 * @returns A mutation accepting campaign creation input.
 *
 * On success it invalidates the campaign list so the new campaign appears.
 */
export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await api.post<Campaign>("/campaigns", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CAMPAIGNS_KEY] });
    },
  });
}

/**
 * Updates an existing campaign.
 *
 * @param id - Campaign id.
 * @returns A mutation accepting a partial campaign payload.
 *
 * Invalidates both the list and the individual campaign cache entry.
 */
export function useUpdateCampaign(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name?: string; description?: string }) => {
      const res = await api.patch<Campaign>(`/campaigns/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CAMPAIGNS_KEY] });
      qc.invalidateQueries({ queryKey: [CAMPAIGNS_KEY, id] });
    },
  });
}

/**
 * Deletes a campaign.
 *
 * @returns A mutation accepting the campaign id to delete.
 *
 * On success it refreshes the user's campaign list.
 */
export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/campaigns/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CAMPAIGNS_KEY] });
    },
  });
}

/**
 * Adds a member to a campaign.
 *
 * @param campaignId - The campaign to add the member to.
 * @returns A mutation accepting an email and role.
 */
export function useAddMember(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      identifier: string;
      identifierType: "email" | "username";
      role: "PLAYER" | "LOREMASTER";
    }) => {
      const res = await api.post<CampaignMember>(`/campaigns/${campaignId}/members`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CAMPAIGNS_KEY, campaignId] });
    },
  });
}

/**
 * Removes a member from a campaign.
 *
 * @param campaignId - The campaign to remove the member from.
 * @returns A mutation accepting the user id to remove.
 */
export function useRemoveMember(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/campaigns/${campaignId}/members/${userId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CAMPAIGNS_KEY, campaignId] });
    },
  });
}

/**
 * Updates a member's role in a campaign.
 *
 * @param campaignId - The campaign whose member role is changing.
 * @returns A mutation accepting a user id and a new role.
 */
export function useUpdateMemberRole(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "PLAYER" | "LOREMASTER" }) => {
      const res = await api.patch<CampaignMember>(`/campaigns/${campaignId}/members/${userId}`, { role });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CAMPAIGNS_KEY, campaignId] });
    },
  });
}
