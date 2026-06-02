import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/axios";
import type { Campaign, CampaignMember } from "../types";

const CAMPAIGNS_KEY = "campaigns";

export function useMyCampaigns() {
  return useQuery({
    queryKey: [CAMPAIGNS_KEY],
    queryFn: async () => {
      const res = await api.get<Campaign[]>("/campaigns/my");
      return res.data;
    },
  });
}

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

export function useAddMember(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; role: "PLAYER" | "LOREMASTER" }) => {
      const res = await api.post<CampaignMember>(`/campaigns/${campaignId}/members`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CAMPAIGNS_KEY, campaignId] });
    },
  });
}

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
