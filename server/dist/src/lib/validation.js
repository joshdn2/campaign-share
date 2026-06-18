"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarDateSchema = exports.campaignCalendarSchema = exports.reorderBlocksSchema = exports.updateBlockSchema = exports.createBlockSchema = exports.blockTypeSchema = exports.createNodeLinkSchema = exports.updateNodeSchema = exports.createNodeSchema = exports.visibilitySchema = exports.nodeTypeSchema = exports.updateMemberSchema = exports.addMemberSchema = exports.updateCampaignSchema = exports.createCampaignSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// ─── Auth ─────────────────────────────────────────────
/**
 * Validates registration payloads.
 *
 * - email: must be a valid email address.
 * - password: minimum 6 characters.
 * - displayName: non-empty, max 50 characters.
 */
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    displayName: zod_1.z.string().min(1).max(50),
});
/**
 * Validates login payloads.
 *
 * - email: must be a valid email address.
 * - password: must be provided (the actual hash comparison happens in the route).
 */
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
// ─── Campaigns ────────────────────────────────────────
/**
 * Validates a request to create a new campaign.
 *
 * - name: required, 1-100 characters.
 * - description: optional, up to 2000 characters.
 */
exports.createCampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(2000).optional(),
});
/**
 * Validates a request to update an existing campaign.
 *
 * All fields are optional because PATCH updates are partial.
 */
exports.updateCampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(2000).optional(),
});
/**
 * Validates a request to add a member to a campaign by email.
 *
 * - email: identifies the user to invite.
 * - role: either PLAYER or LOREMASTER; defaults to PLAYER when omitted.
 */
exports.addMemberSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    role: zod_1.z.enum(["PLAYER", "LOREMASTER"]).default("PLAYER"),
});
/**
 * Validates a request to change an existing member's role.
 */
exports.updateMemberSchema = zod_1.z.object({
    role: zod_1.z.enum(["PLAYER", "LOREMASTER"]),
});
// ─── Nodes ────────────────────────────────────────────
/**
 * Allowed node types in the campaign graph.
 *
 * A node represents a discrete piece of campaign lore or planning, such as a
 * session, character, item, or faction.
 */
exports.nodeTypeSchema = zod_1.z.enum([
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
exports.visibilitySchema = zod_1.z.enum(["PRIVATE", "PUBLIC", "DM_ONLY"]);
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
exports.createNodeSchema = zod_1.z.object({
    type: exports.nodeTypeSchema,
    title: zod_1.z.string().min(1).max(200),
    excerpt: zod_1.z.string().max(2000).optional(),
    visibility: exports.visibilitySchema.default("PUBLIC"),
    parentId: zod_1.z.string().uuid().optional(),
    // Type-specific details are passed as a nested object.
    details: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).default({}),
});
/**
 * Validates a request to update an existing node.
 *
 * All top-level fields are optional because PATCH updates are partial.
 * `parentId` can be explicitly set to null to remove a parent.
 */
exports.updateNodeSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).optional(),
    excerpt: zod_1.z.string().max(2000).optional(),
    visibility: exports.visibilitySchema.optional(),
    parentId: zod_1.z.string().uuid().optional().nullable(),
    details: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
/**
 * Validates a request to create a manual link between two nodes.
 *
 * - targetId: required UUID of the node to link to.
 * - label: optional short descriptor, max 30 characters.
 */
exports.createNodeLinkSchema = zod_1.z.object({
    targetId: zod_1.z.string().uuid(),
    label: zod_1.z.string().max(30).optional(),
});
// ─── Blocks ───────────────────────────────────────────
/**
 * Allowed block types for node content.
 *
 * Blocks represent the structured content inside a node (plain text, rich
 * text, or an image).
 */
exports.blockTypeSchema = zod_1.z.enum(["TEXT", "RICH_TEXT", "IMAGE"]);
/**
 * Validates a request to create a content block on a node.
 *
 * - type: TEXT, RICH_TEXT, or IMAGE.
 * - content: flexible payload depending on block type.
 * - visibility: defaults to PUBLIC.
 * - ordering: optional explicit sort position.
 */
exports.createBlockSchema = zod_1.z.object({
    type: exports.blockTypeSchema,
    content: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
    visibility: exports.visibilitySchema.default("PUBLIC"),
    ordering: zod_1.z.number().int().optional(),
});
/**
 * Validates a request to update a content block.
 *
 * All fields are optional so clients can update just the content, visibility,
 * or ordering independently.
 */
exports.updateBlockSchema = zod_1.z.object({
    type: exports.blockTypeSchema.optional(),
    content: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    visibility: exports.visibilitySchema.optional(),
    ordering: zod_1.z.number().int().optional(),
});
/**
 * Validates the payload for bulk-reordering blocks.
 *
 * blockOrders is an array pairing each block id with its new ordering value.
 */
exports.reorderBlocksSchema = zod_1.z.object({
    blockOrders: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        ordering: zod_1.z.number().int(),
    })),
});
// ─── Calendars ──────────────────────────────────────────────────
/**
 * Validates a custom campaign calendar definition.
 *
 * - name: calendar display name.
 * - daysInWeek: number of days in a week (>= 1).
 * - weekdayNames: ordered list of weekday names, length must equal daysInWeek.
 * - anchorAgeId / anchorMonthId / anchorDay: a date known to be a specific weekday.
 * - anchorWeekdayIndex: index into weekdayNames for the anchor date.
 * - ages: ordered list of calendar ages/epochs.
 * - months: ordered list of months.
 * - moons: optional list of lunar cycles.
 */
exports.campaignCalendarSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    daysInWeek: zod_1.z.number().int().min(1).max(31),
    weekdayNames: zod_1.z.array(zod_1.z.string().min(1).max(30)).min(1),
    anchorAgeId: zod_1.z.string().optional().nullable(),
    anchorMonthId: zod_1.z.string().optional().nullable(),
    anchorDay: zod_1.z.number().int().min(1).optional().nullable(),
    anchorWeekdayIndex: zod_1.z.number().int().min(0),
    ages: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid().optional(),
        name: zod_1.z.string().min(1).max(100),
        startYear: zod_1.z.number().int().min(0).default(0),
        endYear: zod_1.z.number().int().min(0).optional().nullable(),
        order: zod_1.z.number().int().min(0).default(0),
    })),
    months: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid().optional(),
        name: zod_1.z.string().min(1).max(100),
        days: zod_1.z.number().int().min(1).max(1000),
        order: zod_1.z.number().int().min(0).default(0),
    })),
    moons: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid().optional(),
        name: zod_1.z.string().min(1).max(100),
        cycleLength: zod_1.z.number().int().min(1).max(1000),
        anchorAgeId: zod_1.z.string().uuid().optional(),
        anchorMonthId: zod_1.z.string().uuid().optional(),
        anchorDay: zod_1.z.number().int().min(1).optional(),
        order: zod_1.z.number().int().min(0).default(0),
    })).default([]),
});
/**
 * Validates a single custom calendar date (age + year + month + day).
 */
exports.calendarDateSchema = zod_1.z.object({
    ageId: zod_1.z.string().uuid(),
    year: zod_1.z.number().int().min(0),
    monthId: zod_1.z.string().uuid(),
    day: zod_1.z.number().int().min(1),
});
