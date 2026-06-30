/**
 * useNodes.ts
 *
 * TanStack Query hooks for node resources. Nodes represent campaign
 * entities such as sessions, characters, items, etc. Mutations
 * invalidate both node and campaign queries so dependent UI updates.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/axios";
import { BLOCKS_KEY } from "./useBlocks";
import type { Node, Visibility } from "../types";

// Shared root query key for all node queries.
const NODES_KEY = "nodes";

/**
 * Fetches all nodes belonging to a campaign.
 *
 * @param campaignId - The campaign id.
 * @returns A TanStack Query result wrapping Node[].
 *
 * Disabled until a truthy campaignId is provided.
 */
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

/**
 * Fetches a single node by id.
 *
 * @param nodeId - The node id.
 * @returns A TanStack Query result wrapping Node.
 *
 * Disabled until a truthy nodeId is provided.
 */
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

/**
 * Creates a new node within a campaign.
 *
 * @param campaignId - The campaign id.
 * @returns A mutation accepting node creation input.
 *
 * On success it invalidates the campaign's node list and the campaign detail.
 */
export function useCreateNode(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      type: string;
      title: string;
      excerpt?: string | null;
      visibility?: Visibility;
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

/**
 * Updates an existing node.
 *
 * @param nodeId - The node id.
 * @returns A mutation accepting a partial node payload.
 *
 * On success it invalidates the node detail and, if the response contains
 * the campaign id, the campaign's node list and campaign detail as well.
 */
export function useUpdateNode(nodeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title?: string;
      excerpt?: string | null;
      visibility?: Visibility;
      parentId?: string | null;
      details?: Record<string, unknown>;
    }) => {
      const res = await api.patch<Node>(`/nodes/${nodeId}`, data);
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [NODES_KEY, nodeId] });
      qc.invalidateQueries({ queryKey: [BLOCKS_KEY, nodeId] });
      if (data.campaignId) {
        qc.invalidateQueries({ queryKey: [NODES_KEY, "campaign", data.campaignId] });
        qc.invalidateQueries({ queryKey: ["campaigns", data.campaignId] });
      }
    },
  });
}

/**
 * Merges another node into the requested node.
 *
 * @param nodeId - The surviving node id.
 * @returns A mutation accepting the secondary node id and the user's
 * per-field choices.
 *
 * On success it invalidates the surviving node detail and the campaign's
 * node list.
 */
export function useMergeNode(nodeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      secondaryId: string;
      choices: {
        title?: "primary" | "secondary";
        excerpt?: "primary" | "secondary";
        details: Record<string, "primary" | "secondary">;
      };
    }) => {
      const res = await api.post<Node>(`/nodes/${nodeId}/merge`, data);
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

/**
 * Deletes a node.
 *
 * @returns A mutation accepting { nodeId, campaignId }.
 *
 * Returns both ids from the mutation so onSuccess can invalidate the
 * campaign's node list and the campaign detail.
 */
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

/**
 * Creates a manual bidirectional link from a source node to a target node.
 *
 * @param nodeId - The source node id.
 * @param campaignId - The campaign id used to refresh related queries.
 * @returns A mutation accepting { targetId, label? }.
 *
 * On success it invalidates the source node detail and the campaign node list.
 */
export function useCreateLink(nodeId: string, campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { targetId: string; label?: string }) => {
      const res = await api.post<{ message: string }>(`/nodes/${nodeId}/links`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NODES_KEY, nodeId] });
      qc.invalidateQueries({ queryKey: [NODES_KEY, "campaign", campaignId] });
    },
  });
}

/**
 * Deletes a manual link between two nodes.
 *
 * @param nodeId - The node id whose detail view is showing the link.
 * @param campaignId - The campaign id used to refresh related queries.
 * @returns A mutation accepting the link id.
 *
 * On success it invalidates the source node detail and the campaign node list.
 */
export function useDeleteLink(nodeId: string, campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      const res = await api.delete<{ message: string }>(`/nodes/${nodeId}/links/${linkId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NODES_KEY, nodeId] });
      qc.invalidateQueries({ queryKey: [NODES_KEY, "campaign", campaignId] });
    },
  });
}
