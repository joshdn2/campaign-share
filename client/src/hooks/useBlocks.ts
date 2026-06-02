import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/axios";
import type { NodeBlock } from "../types";

const BLOCKS_KEY = "blocks";

export function useNodeBlocks(nodeId: string) {
  return useQuery({
    queryKey: [BLOCKS_KEY, nodeId],
    queryFn: async () => {
      const res = await api.get<NodeBlock[]>(`/blocks/node/${nodeId}`);
      return res.data;
    },
    enabled: !!nodeId,
  });
}

export function useCreateBlock(nodeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      type: string;
      content: Record<string, unknown>;
      visibility?: string;
      ordering?: number;
    }) => {
      const res = await api.post<NodeBlock>(`/blocks/node/${nodeId}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BLOCKS_KEY, nodeId] });
      qc.invalidateQueries({ queryKey: ["nodes", nodeId] });
    },
  });
}

export function useUpdateBlock(blockId: string, nodeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      type?: string;
      content?: Record<string, unknown>;
      visibility?: string;
      ordering?: number;
    }) => {
      const res = await api.patch<NodeBlock>(`/blocks/${blockId}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BLOCKS_KEY, nodeId] });
      qc.invalidateQueries({ queryKey: ["nodes", nodeId] });
    },
  });
}

export function useDeleteBlock(blockId: string, nodeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/blocks/${blockId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BLOCKS_KEY, nodeId] });
      qc.invalidateQueries({ queryKey: ["nodes", nodeId] });
    },
  });
}

export function useReorderBlocks(nodeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (blockOrders: { id: string; ordering: number }[]) => {
      const res = await api.patch<NodeBlock[]>(`/blocks/node/${nodeId}/reorder`, { blockOrders });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BLOCKS_KEY, nodeId] });
      qc.invalidateQueries({ queryKey: ["nodes", nodeId] });
    },
  });
}
