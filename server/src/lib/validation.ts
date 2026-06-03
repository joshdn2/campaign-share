import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1).max(50),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Campaigns ────────────────────────────────────────

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["PLAYER", "LOREMASTER"]).default("PLAYER"),
});

export const updateMemberSchema = z.object({
  role: z.enum(["PLAYER", "LOREMASTER"]),
});

// ─── Nodes ────────────────────────────────────────────

export const nodeTypeSchema = z.enum([
  "ARC",
  "SESSION",
  "CHARACTER",
  "CREATURE",
  "ITEM",
  "LOCATION",
  "NOTE",
  "FACTION",
]);

export const visibilitySchema = z.enum(["PRIVATE", "PUBLIC", "DM_ONLY"]);

export const createNodeSchema = z.object({
  type: nodeTypeSchema,
  title: z.string().min(1).max(200),
  excerpt: z.string().max(2000).optional(),
  visibility: visibilitySchema.default("PUBLIC"),
  parentId: z.string().uuid().optional(),
  // Type-specific details are passed as a nested object
  details: z.record(z.string(), z.unknown()).default({}),
});

export const updateNodeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  excerpt: z.string().max(2000).optional(),
  visibility: visibilitySchema.optional(),
  parentId: z.string().uuid().optional().nullable(),
  details: z.record(z.string(), z.unknown()).optional(),
});

// ─── Blocks ───────────────────────────────────────────

export const blockTypeSchema = z.enum(["TEXT", "RICH_TEXT", "IMAGE"]);

export const createBlockSchema = z.object({
  type: blockTypeSchema,
  content: z.record(z.string(), z.unknown()),
  visibility: visibilitySchema.default("PUBLIC"),
  ordering: z.number().int().optional(),
});

export const updateBlockSchema = z.object({
  type: blockTypeSchema.optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  visibility: visibilitySchema.optional(),
  ordering: z.number().int().optional(),
});

export const reorderBlocksSchema = z.object({
  blockOrders: z.array(
    z.object({
      id: z.string().uuid(),
      ordering: z.number().int(),
    })
  ),
});

// ─── Types ────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type CreateNodeInput = z.infer<typeof createNodeSchema>;
export type UpdateNodeInput = z.infer<typeof updateNodeSchema>;
export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;
export type ReorderBlocksInput = z.infer<typeof reorderBlocksSchema>;
