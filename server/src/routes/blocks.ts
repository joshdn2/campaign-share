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

import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { createBlockSchema, updateBlockSchema, reorderBlocksSchema } from "../lib/validation";

const router = Router();

// Every block endpoint requires a logged-in user.
router.use(requireAuth);

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
  const userId = req.user!.userId;

  // Load the node and its campaign's DM so we can compute access rights.
  const node = await prisma.node.findUnique({
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
  const canAccessNode =
    node.visibility === "PUBLIC" ||
    (node.visibility === "PRIVATE" && isOwner) ||
    (node.visibility === "DM_ONLY" && isDm);

  if (!canAccessNode) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  // Query blocks with the same visibility filtering rules applied.
  const blocks = await prisma.nodeBlock.findMany({
    where: {
      nodeId,
      OR: [
        { visibility: "PUBLIC" as const },
        { authorId: userId, visibility: "PRIVATE" as const },
        // DM-only blocks are visible to the campaign DM and the block author.
        { authorId: userId, visibility: "DM_ONLY" as const },
        ...(isDm ? [{ visibility: "DM_ONLY" as const }] : []),
      ],
    },
    include: {
      author: { select: { id: true, username: true } },
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
  const userId = req.user!.userId;

  const node = await prisma.node.findUnique({
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
  const isMember =
    isDm ||
    isOwner ||
    (await prisma.campaignMember.findFirst({
      where: { campaignId: node.campaignId!, userId },
    }));

  if (!isMember) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const parse = createBlockSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const { type, content, visibility, ordering } = parse.data;

  // Get max ordering if not provided so the new block lands at the end.
  let finalOrdering = ordering;
  if (finalOrdering === undefined) {
    const agg = await prisma.nodeBlock.aggregate({
      where: { nodeId },
      _max: { ordering: true },
    });
    finalOrdering = (agg._max.ordering ?? -1) + 1;
  }

  const block = await prisma.nodeBlock.create({
    data: {
      nodeId,
      authorId: userId,
      type,
      content: content as any,
      visibility,
      ordering: finalOrdering,
    },
    include: {
      author: { select: { id: true, username: true } },
    },
  });

  res.status(201).json(block);
});

/**
 * PATCH /api/blocks/:id
 *
 * Update a block's type, content, visibility, or ordering.
 *
 * The block's author, the campaign DM, or a Loremaster may edit it.
 */
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const block = await prisma.nodeBlock.findUnique({
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
  const membership = await prisma.campaignMember.findFirst({
    where: { campaignId: block.node.campaignId!, userId },
  });
  const isLoremaster = membership?.role === "LOREMASTER";
  if (!isAuthor && !isDm && !isLoremaster) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const parse = updateBlockSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const updated = await prisma.nodeBlock.update({
    where: { id },
    data: {
      type: parse.data.type ?? undefined,
      content: (parse.data.content as any) ?? undefined,
      visibility: parse.data.visibility ?? undefined,
      ordering: parse.data.ordering ?? undefined,
    },
    include: {
      author: { select: { id: true, username: true } },
    },
  });

  res.json(updated);
});

/**
 * DELETE /api/blocks/:id
 *
 * Delete a content block.
 *
 * The block's author, the campaign DM, or a Loremaster may delete it.
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const block = await prisma.nodeBlock.findUnique({
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
  const membership = await prisma.campaignMember.findFirst({
    where: { campaignId: block.node.campaignId!, userId },
  });
  const isLoremaster = membership?.role === "LOREMASTER";
  if (!isAuthor && !isDm && !isLoremaster) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  await prisma.nodeBlock.delete({ where: { id } });
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
  const userId = req.user!.userId;

  const node = await prisma.node.findUnique({
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

  const parse = reorderBlocksSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const { blockOrders } = parse.data;

  // Run all ordering updates atomically.
  await prisma.$transaction(
    blockOrders.map((bo) =>
      prisma.nodeBlock.update({
        where: { id: bo.id },
        data: { ordering: bo.ordering },
      })
    )
  );

  // Return the reordered list with visibility filtering applied.
  const blocks = await prisma.nodeBlock.findMany({
    where: {
      nodeId,
      OR: [
        { visibility: "PUBLIC" as const },
        { authorId: userId, visibility: "PRIVATE" as const },
        // DM-only blocks are visible to the campaign DM and the block author.
        { authorId: userId, visibility: "DM_ONLY" as const },
        ...(isDm ? [{ visibility: "DM_ONLY" as const }] : []),
      ],
    },
    include: {
      author: { select: { id: true, username: true } },
    },
    orderBy: { ordering: "asc" },
  });

  res.json(blocks);
});

export default router;
