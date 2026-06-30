/**
 * useBlocks.ts
 *
 * TanStack Query hooks for managing NodeBlock resources. A block belongs
 * to a node and represents a piece of content (text, rich text, image).
 * All mutations invalidate the relevant block and node queries so that
 * the UI stays in sync with the server.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/axios";
import type { NodeBlock } from "../types";

// Shared root query key for all block queries.
export const BLOCKS_KEY = "blocks";

/**
 * Fetches all blocks for a given node.
 *
 * @param nodeId - The node id to load blocks for.
 * @returns A TanStack Query result wrapping NodeBlock[].
 *
 * The query is disabled until a truthy nodeId is provided.
 */
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

/**
 * Creates a new block on the given node.
 *
 * @param nodeId - The parent node id.
 * @returns A mutation that accepts block creation input.
 *
 * On success it invalidates:
 * - the block list for this node
 * - the individual node query
 */
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

/**
 * Updates an existing block.
 *
 * @param nodeId - The parent node id (used for cache invalidation).
 * @returns A mutation that accepts a block id and a partial update payload.
 */
export function useUpdateBlock(nodeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      blockId,
      data,
    }: {
      blockId: string;
      data: {
        type?: string;
        content?: Record<string, unknown>;
        visibility?: string;
        ordering?: number;
      };
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

/**
 * Deletes a block.
 *
 * @param nodeId - The parent node id (used for cache invalidation).
 * @returns A mutation that accepts the block id to delete.
 */
export function useDeleteBlock(nodeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (blockId: string) => {
      await api.delete(`/blocks/${blockId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BLOCKS_KEY, nodeId] });
      qc.invalidateQueries({ queryKey: ["nodes", nodeId] });
    },
  });
}

/**
 * Reorders blocks within a node.
 *
 * @param nodeId - The parent node id.
 * @returns A mutation that accepts an array of { id, ordering } updates.
 */
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
