"use strict";
/**
 * routes/blocks.ts
 *
 * Router for node content blocks.
 *
 * Blocks are structured pieces of content attached to a node (text, rich text,
 * or image). This module handles listing, creating, updating, deleting, and
 * reordering blocks. All routes require authentication, and each handler
 * enforces campaign membership or ownership rules before touching data.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../lib/validation");
const router = (0, express_1.Router)();
// Every block endpoint requires a logged-in user.
router.use(auth_1.requireAuth);
/**
 * GET /api/blocks/node/:nodeId
 *
 * List all blocks for a node that the caller is allowed to see.
 *
 * Access rules:
 * - The node must exist.
 * - The caller must be able to view the node (public, owner of private, or DM
 *   for DM-only).
 * - Returned blocks are filtered by visibility: public blocks, the caller's own
 *   private blocks, and DM-only blocks when the caller is the DM.
 */
router.get("/node/:nodeId", async (req, res) => {
    const { nodeId } = req.params;
    const userId = req.user.userId;
    // Load the node and its campaign's DM so we can compute access rights.
    const node = await db_1.prisma.node.findUnique({
        where: { id: nodeId },
        include: { campaign: { select: { dmId: true } } },
    });
    if (!node) {
        res.status(404).json({ error: "Node not found" });
        return;
    }
    const isDm = node.campaign?.dmId === userId;
    const isOwner = node.ownerId === userId;
    // Check access to node first.
    const canAccessNode = node.visibility === "PUBLIC" ||
        (node.visibility === "PRIVATE" && isOwner) ||
        (node.visibility === "DM_ONLY" && isDm);
    if (!canAccessNode) {
        res.status(403).json({ error: "Access denied" });
        return;
    }
    // Query blocks with the same visibility filtering rules applied.
    const blocks = await db_1.prisma.nodeBlock.findMany({
        where: {
            nodeId,
            OR: [
                { visibility: "PUBLIC" },
                { authorId: userId, visibility: "PRIVATE" },
                // DM-only blocks are visible only to the campaign DM.
                ...(isDm ? [{ visibility: "DM_ONLY" }] : []),
            ],
        },
        include: {
            author: { select: { id: true, displayName: true } },
        },
        orderBy: { ordering: "asc" },
    });
    res.json(blocks);
});
/**
 * POST /api/blocks/node/:nodeId
 *
 * Create a new content block on a node.
 *
 * Only campaign members (DM, node owner, or recorded campaign member) can add
 * blocks. If no explicit ordering is provided, the block is appended after the
 * current highest-ordered block.
 */
router.post("/node/:nodeId", async (req, res) => {
    const { nodeId } = req.params;
    const userId = req.user.userId;
    const node = await db_1.prisma.node.findUnique({
        where: { id: nodeId },
        include: { campaign: { select: { dmId: true } } },
    });
    if (!node) {
        res.status(404).json({ error: "Node not found" });
        return;
    }
    const isDm = node.campaign?.dmId === userId;
    const isOwner = node.ownerId === userId;
    // Membership check: DM or node owner is always allowed; otherwise require a
    // matching CampaignMember record.
    const isMember = isDm ||
        isOwner ||
        (await db_1.prisma.campaignMember.findFirst({
            where: { campaignId: node.campaignId, userId },
        }));
    if (!isMember) {
        res.status(403).json({ error: "Access denied" });
        return;
    }
    const parse = validation_1.createBlockSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ error: parse.error.flatten() });
        return;
    }
    const { type, content, visibility, ordering } = parse.data;
    // Get max ordering if not provided so the new block lands at the end.
    let finalOrdering = ordering;
    if (finalOrdering === undefined) {
        const agg = await db_1.prisma.nodeBlock.aggregate({
            where: { nodeId },
            _max: { ordering: true },
        });
        finalOrdering = (agg._max.ordering ?? -1) + 1;
    }
    const block = await db_1.prisma.nodeBlock.create({
        data: {
            nodeId,
            authorId: userId,
            type,
            content: content,
            visibility,
            ordering: finalOrdering,
        },
        include: {
            author: { select: { id: true, displayName: true } },
        },
    });
    res.status(201).json(block);
});
/**
 * PATCH /api/blocks/:id
 *
 * Update a block's type, content, visibility, or ordering.
 *
 * Only the block's original author or the campaign DM may edit it.
 */
router.patch("/:id", async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const block = await db_1.prisma.nodeBlock.findUnique({
        where: { id },
        include: {
            node: { include: { campaign: { select: { dmId: true } } } },
        },
    });
    if (!block) {
        res.status(404).json({ error: "Block not found" });
        return;
    }
    const isAuthor = block.authorId === userId;
    const isDm = block.node.campaign?.dmId === userId;
    if (!isAuthor && !isDm) {
        res.status(403).json({ error: "Access denied" });
        return;
    }
    const parse = validation_1.updateBlockSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ error: parse.error.flatten() });
        return;
    }
    const updated = await db_1.prisma.nodeBlock.update({
        where: { id },
        data: {
            type: parse.data.type ?? undefined,
            content: parse.data.content ?? undefined,
            visibility: parse.data.visibility ?? undefined,
            ordering: parse.data.ordering ?? undefined,
        },
        include: {
            author: { select: { id: true, displayName: true } },
        },
    });
    res.json(updated);
});
/**
 * DELETE /api/blocks/:id
 *
 * Delete a content block.
 *
 * Only the block's author or the campaign DM may delete it.
 */
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const block = await db_1.prisma.nodeBlock.findUnique({
        where: { id },
        include: {
            node: { include: { campaign: { select: { dmId: true } } } },
        },
    });
    if (!block) {
        res.status(404).json({ error: "Block not found" });
        return;
    }
    const isAuthor = block.authorId === userId;
    const isDm = block.node.campaign?.dmId === userId;
    if (!isAuthor && !isDm) {
        res.status(403).json({ error: "Access denied" });
        return;
    }
    await db_1.prisma.nodeBlock.delete({ where: { id } });
    res.json({ message: "Block deleted" });
});
/**
 * PATCH /api/blocks/node/:nodeId/reorder
 *
 * Bulk-update the ordering of all blocks in a node.
 *
 * Only the node owner or the campaign DM may reorder blocks. The updates run
 * inside a Prisma transaction so either all order values are persisted or none
 * are, avoiding a corrupted sort order on partial failure.
 */
router.patch("/node/:nodeId/reorder", async (req, res) => {
    const { nodeId } = req.params;
    const userId = req.user.userId;
    const node = await db_1.prisma.node.findUnique({
        where: { id: nodeId },
        include: { campaign: { select: { dmId: true } } },
    });
    if (!node) {
        res.status(404).json({ error: "Node not found" });
        return;
    }
    const isDm = node.campaign?.dmId === userId;
    const isOwner = node.ownerId === userId;
    if (!isOwner && !isDm) {
        res.status(403).json({ error: "Access denied" });
        return;
    }
    const parse = validation_1.reorderBlocksSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ error: parse.error.flatten() });
        return;
    }
    const { blockOrders } = parse.data;
    // Run all ordering updates atomically.
    await db_1.prisma.$transaction(blockOrders.map((bo) => db_1.prisma.nodeBlock.update({
        where: { id: bo.id },
        data: { ordering: bo.ordering },
    })));
    // Return the reordered list with visibility filtering applied.
    const blocks = await db_1.prisma.nodeBlock.findMany({
        where: {
            nodeId,
            OR: [
                { visibility: "PUBLIC" },
                { authorId: userId, visibility: "PRIVATE" },
                ...(isDm ? [{ visibility: "DM_ONLY" }] : []),
            ],
        },
        include: {
            author: { select: { id: true, displayName: true } },
        },
        orderBy: { ordering: "asc" },
    });
    res.json(blocks);
});
exports.default = router;
