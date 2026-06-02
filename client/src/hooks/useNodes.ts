import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/axios";
import type { Node } from "../types";

const NODES_KEY = "nodes";

export function useCampaignNodes(campaignId: string) {
  return useQuery({
    queryKey: [NODES_KEY, "campaign", campaignId],
    queryFn: async () => {
      const res = await api.get<Node[]>(`/nodes/campaign/${campaignId}`);
      return res.data;
    },
    enabled: !!campaignId,
  });
}

export function useNode(nodeId: string) {
  return useQuery({
    queryKey: [NODES_KEY, nodeId],
    queryFn: async () => {
      const res = await api.get<Node>(`/nodes/${nodeId}`);
      return res.data;
    },
    enabled: !!nodeId,
  });
}

export function useCreateNode(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      type: string;
      title: string;
      excerpt?: string;
      visibility?: string;
      parentId?: string;
      details?: Record<string, unknown>;
    }) => {
      const res = await api.post<Node>(`/nodes/campaign/${campaignId}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NODES_KEY, "campaign", campaignId] });
      qc.invalidateQueries({ queryKey: ["campaigns", campaignId] });
    },
  });
}

export function useUpdateNode(nodeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title?: string;
      excerpt?: string;
      visibility?: string;
      parentId?: string | null;
      details?: Record<string, unknown>;
    }) => {
      const res = await api.patch<Node>(`/nodes/${nodeId}`, data);
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [NODES_KEY, nodeId] });
      if (data.campaignId) {
        qc.invalidateQueries({ queryKey: [NODES_KEY, "campaign", data.campaignId] });
        qc.invalidateQueries({ queryKey: ["campaigns", data.campaignId] });
      }
    },
  });
}

export function useDeleteNode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ nodeId, campaignId }: { nodeId: string; campaignId: string }) => {
      await api.delete(`/nodes/${nodeId}`);
      return { nodeId, campaignId };
    },
    onSuccess: (vars) => {
      qc.invalidateQueries({ queryKey: [NODES_KEY, "campaign", vars.campaignId] });
      qc.invalidateQueries({ queryKey: ["campaigns", vars.campaignId] });
    },
  });
}
