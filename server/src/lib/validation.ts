/**
 * validation.ts
 *
 * Central location for Zod schemas that validate incoming request bodies.
 *
 * Every route that accepts user input uses `safeParse` against one of these
 * schemas. Keeping schemas in one place makes the API contract easy to review
 * and update. The inferred TypeScript types at the bottom of the file give the
 * handlers strongly typed inputs without duplicating shape definitions.
 */

import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────

/**
 * Validates registration payloads.
 *
 * - email: must be a valid email address.
 * - password: minimum 6 characters.
 * - displayName: non-empty, max 50 characters.
 */
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1).max(50),
});

/**
 * Validates login payloads.
 *
 * - email: must be a valid email address.
 * - password: must be provided (the actual hash comparison happens in the route).
 */
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Campaigns ────────────────────────────────────────

/**
 * Validates a request to create a new campaign.
 *
 * - name: required, 1-100 characters.
 * - description: optional, up to 2000 characters.
 */
export const createCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
});

/**
 * Validates a request to update an existing campaign.
 *
 * All fields are optional because PATCH updates are partial.
 */
export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
});

/**
 * Validates a request to add a member to a campaign by email.
 *
 * - email: identifies the user to invite.
 * - role: either PLAYER or LOREMASTER; defaults to PLAYER when omitted.
 */
export const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["PLAYER", "LOREMASTER"]).default("PLAYER"),
});

/**
 * Validates a request to change an existing member's role.
 */
export const updateMemberSchema = z.object({
  role: z.enum(["PLAYER", "LOREMASTER"]),
});

// ─── Nodes ────────────────────────────────────────────

/**
 * Allowed node types in the campaign graph.
 *
 * A node represents a discrete piece of campaign lore or planning, such as a
 * session, character, item, or faction.
 */
export const nodeTypeSchema = z.enum([
  "SESSION",
  "CHARACTER",
  "CREATURE",
  "ITEM",
  "LOCATION",
  "NOTE",
  "FACTION",
]);

/**
 * Visibility levels control who can see a node or block.
 *
 * - PUBLIC: visible to all campaign members.
 * - PRIVATE: visible only to the author/owner.
 * - DM_ONLY: visible only to the Dungeon Master.
 */
export const visibilitySchema = z.enum(["PRIVATE", "PUBLIC", "DM_ONLY"]);

/**
 * Validates a request to create a node.
 *
 * - type: which kind of node this is (character, location, etc.).
 * - title: short display name.
 * - excerpt: optional longer summary.
 * - visibility: defaults to PUBLIC.
 * - parentId: optional UUID of a parent node for hierarchy.
 * - details: flexible nested object holding type-specific fields.
 */
export const createNodeSchema = z.object({
  type: nodeTypeSchema,
  title: z.string().min(1).max(200),
  excerpt: z.string().max(2000).optional(),
  visibility: visibilitySchema.default("PUBLIC"),
  parentId: z.string().uuid().optional(),
  // Type-specific details are passed as a nested object.
  details: z.record(z.string(), z.unknown()).default({}),
});

/**
 * Validates a request to update an existing node.
 *
 * All top-level fields are optional because PATCH updates are partial.
 * `parentId` can be explicitly set to null to remove a parent.
 */
export const updateNodeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  excerpt: z.string().max(2000).optional(),
  visibility: visibilitySchema.optional(),
  parentId: z.string().uuid().optional().nullable(),
  details: z.record(z.string(), z.unknown()).optional(),
});

// ─── Blocks ───────────────────────────────────────────

/**
 * Allowed block types for node content.
 *
 * Blocks represent the structured content inside a node (plain text, rich
 * text, or an image).
 */
export const blockTypeSchema = z.enum(["TEXT", "RICH_TEXT", "IMAGE"]);

/**
 * Validates a request to create a content block on a node.
 *
 * - type: TEXT, RICH_TEXT, or IMAGE.
 * - content: flexible payload depending on block type.
 * - visibility: defaults to PUBLIC.
 * - ordering: optional explicit sort position.
 */
export const createBlockSchema = z.object({
  type: blockTypeSchema,
  content: z.record(z.string(), z.unknown()),
  visibility: visibilitySchema.default("PUBLIC"),
  ordering: z.number().int().optional(),
});

/**
 * Validates a request to update a content block.
 *
 * All fields are optional so clients can update just the content, visibility,
 * or ordering independently.
 */
export const updateBlockSchema = z.object({
  type: blockTypeSchema.optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  visibility: visibilitySchema.optional(),
  ordering: z.number().int().optional(),
});

/**
 * Validates the payload for bulk-reordering blocks.
 *
 * blockOrders is an array pairing each block id with its new ordering value.
 */
export const reorderBlocksSchema = z.object({
  blockOrders: z.array(
    z.object({
      id: z.string().uuid(),
      ordering: z.number().int(),
    })
  ),
});

// ─── Types ────────────────────────────────────────────

// Infer strongly typed input interfaces from the Zod schemas above.
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
