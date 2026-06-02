import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { createBlockSchema, updateBlockSchema, reorderBlocksSchema } from "../lib/validation";

const router = Router();

router.use(requireAuth);

// GET /api/nodes/:nodeId/blocks — list blocks for a node
router.get("/node/:nodeId", async (req, res) => {
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

  // Check access to node first
  const canAccessNode =
    node.visibility === "PUBLIC" ||
    (node.visibility === "PRIVATE" && isOwner) ||
    (node.visibility === "DM_ONLY" && isDm);

  if (!canAccessNode) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const blocks = await prisma.nodeBlock.findMany({
    where: {
      nodeId,
      OR: [
        { visibility: "PUBLIC" as const },
        { authorId: userId, visibility: "PRIVATE" as const },
        ...(isDm ? [{ visibility: "DM_ONLY" as const }] : []),
      ],
    },
    include: {
      author: { select: { id: true, displayName: true } },
    },
    orderBy: { ordering: "asc" },
  });

  res.json(blocks);
});

// POST /api/nodes/:nodeId/blocks — create block
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

  // Get max ordering if not provided
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
      author: { select: { id: true, displayName: true } },
    },
  });

  res.status(201).json(block);
});

// PATCH /api/blocks/:id — update block
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
  if (!isAuthor && !isDm) {
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
      author: { select: { id: true, displayName: true } },
    },
  });

  res.json(updated);
});

// DELETE /api/blocks/:id — delete block
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
  if (!isAuthor && !isDm) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  await prisma.nodeBlock.delete({ where: { id } });
  res.json({ message: "Block deleted" });
});

// PATCH /api/nodes/:nodeId/blocks/reorder — bulk reorder
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

  await prisma.$transaction(
    blockOrders.map((bo) =>
      prisma.nodeBlock.update({
        where: { id: bo.id },
        data: { ordering: bo.ordering },
      })
    )
  );

  const blocks = await prisma.nodeBlock.findMany({
    where: {
      nodeId,
      OR: [
        { visibility: "PUBLIC" as const },
        { authorId: userId, visibility: "PRIVATE" as const },
        ...(isDm ? [{ visibility: "DM_ONLY" as const }] : []),
      ],
    },
    include: {
      author: { select: { id: true, displayName: true } },
    },
    orderBy: { ordering: "asc" },
  });

  res.json(blocks);
});

export default router;
