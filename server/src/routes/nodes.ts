import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { createNodeSchema, updateNodeSchema } from "../lib/validation";

const router = Router();

router.use(requireAuth);

// Helper to build node visibility filter
function buildNodeVisibilityFilter(campaignDmId: string | null, userId: string) {
  const isDm = campaignDmId === userId;
  if (isDm) return {};
  return {
    OR: [
      { visibility: "PUBLIC" as const },
      { ownerId: userId, visibility: "PRIVATE" as const },
    ],
  };
}

// Helper to include detail based on type
function detailInclude(type: string) {
  switch (type) {
    case "ARC":
      return { arcDetail: true };
    case "SESSION":
      return { sessionDetail: true };
    case "CHARACTER":
      return { characterDetail: true };
    case "CREATURE":
      return { creatureDetail: true };
    case "ITEM":
      return { itemDetail: true };
    case "LOCATION":
      return { locationDetail: true };
    default:
      return {};
  }
}

// Helper to create detail record
async function createDetail(tx: any, nodeId: string, type: string, details: Record<string, unknown>) {
  switch (type) {
    case "ARC":
      return tx.arcDetail.create({
        data: {
          nodeId,
          arcNumber: Number(details.arcNumber) || 1,
          description: (details.description as string) || null,
        },
      });
    case "SESSION":
      return tx.sessionDetail.create({
        data: {
          nodeId,
          sessionNumber: Number(details.sessionNumber) || 1,
          sessionDate: details.sessionDate ? new Date(details.sessionDate as string) : null,
          shortSummary: (details.shortSummary as string) || null,
          longSummary: (details.longSummary as string) || null,
          campaignId: (details.campaignId as string) || null,
        },
      });
    case "CHARACTER":
      return tx.characterDetail.create({
        data: {
          nodeId,
          physicalDescription: (details.physicalDescription as string) || null,
          gender: (details.gender as string) || null,
          alignment: (details.alignment as string) || null,
          personality: (details.personality as string) || null,
          race: (details.race as string) || null,
          class: (details.class as string) || null,
          level: details.level != null ? Number(details.level) : null,
          isPC: Boolean(details.isPC),
          age: (details.age as string) || null,
          voice: (details.voice as string) || null,
          mannerisms: (details.mannerisms as string) || null,
          goals: (details.goals as string) || null,
          secrets: (details.secrets as string) || null,
          abilities: (details.abilities as string) || null,
        },
      });
    case "CREATURE":
      return tx.creatureDetail.create({
        data: {
          nodeId,
          species: (details.species as string) || null,
          size: (details.size as string) || null,
          challengeRating: (details.challengeRating as string) || null,
          habitat: (details.habitat as string) || null,
          stats: (details.stats as any) || {},
          abilities: (details.abilities as string) || null,
        },
      });
    case "ITEM":
      return tx.itemDetail.create({
        data: {
          nodeId,
          weight: (details.weight as string) || null,
          value: (details.value as string) || null,
          rarity: (details.rarity as string) || null,
          itemType: (details.itemType as string) || null,
          requiresAttunement: Boolean(details.requiresAttunement),
          abilities: (details.abilities as string) || null,
        },
      });
    case "LOCATION":
      return tx.locationDetail.create({
        data: {
          nodeId,
          region: (details.region as string) || null,
          climate: (details.climate as string) || null,
          population: (details.population as string) || null,
          locationType: (details.locationType as any) || "POINT_OF_INTEREST",
        },
      });
    default:
      return null;
  }
}

// Helper to update detail record
async function updateDetail(tx: any, nodeId: string, type: string, details: Record<string, unknown>) {
  switch (type) {
    case "ARC":
      return tx.arcDetail.upsert({
        where: { nodeId },
        create: {
          nodeId,
          arcNumber: Number(details.arcNumber) || 1,
          description: (details.description as string) || null,
        },
        update: {
          arcNumber: details.arcNumber != null ? Number(details.arcNumber) : undefined,
          description: details.description as string | undefined,
        },
      });
    case "SESSION":
      return tx.sessionDetail.upsert({
        where: { nodeId },
        create: {
          nodeId,
          sessionNumber: Number(details.sessionNumber) || 1,
          sessionDate: details.sessionDate ? new Date(details.sessionDate as string) : null,
          shortSummary: (details.shortSummary as string) || null,
          longSummary: (details.longSummary as string) || null,
          campaignId: (details.campaignId as string) || null,
        },
        update: {
          sessionNumber: details.sessionNumber != null ? Number(details.sessionNumber) : undefined,
          sessionDate: details.sessionDate ? new Date(details.sessionDate as string) : undefined,
          shortSummary: details.shortSummary as string | undefined,
          longSummary: details.longSummary as string | undefined,
        },
      });
    case "CHARACTER":
      return tx.characterDetail.upsert({
        where: { nodeId },
        create: {
          nodeId,
          physicalDescription: (details.physicalDescription as string) || null,
          gender: (details.gender as string) || null,
          alignment: (details.alignment as string) || null,
          personality: (details.personality as string) || null,
          race: (details.race as string) || null,
          class: (details.class as string) || null,
          level: details.level != null ? Number(details.level) : null,
          isPC: Boolean(details.isPC),
          age: (details.age as string) || null,
          voice: (details.voice as string) || null,
          mannerisms: (details.mannerisms as string) || null,
          goals: (details.goals as string) || null,
          secrets: (details.secrets as string) || null,
          abilities: (details.abilities as string) || null,
        },
        update: {
          physicalDescription: details.physicalDescription as string | undefined,
          gender: details.gender as string | undefined,
          alignment: details.alignment as string | undefined,
          personality: details.personality as string | undefined,
          race: details.race as string | undefined,
          class: details.class as string | undefined,
          level: details.level != null ? Number(details.level) : undefined,
          isPC: details.isPC != null ? Boolean(details.isPC) : undefined,
          age: details.age as string | undefined,
          voice: details.voice as string | undefined,
          mannerisms: details.mannerisms as string | undefined,
          goals: details.goals as string | undefined,
          secrets: details.secrets as string | undefined,
          abilities: details.abilities as string | undefined,
        },
      });
    case "CREATURE":
      return tx.creatureDetail.upsert({
        where: { nodeId },
        create: {
          nodeId,
          species: (details.species as string) || null,
          size: (details.size as string) || null,
          challengeRating: (details.challengeRating as string) || null,
          habitat: (details.habitat as string) || null,
          stats: details.stats || {},
          abilities: (details.abilities as string) || null,
        },
        update: {
          species: details.species as string | undefined,
          size: details.size as string | undefined,
          challengeRating: details.challengeRating as string | undefined,
          habitat: details.habitat as string | undefined,
          stats: details.stats as any | undefined,
          abilities: details.abilities as string | undefined,
        },
      });
    case "ITEM":
      return tx.itemDetail.upsert({
        where: { nodeId },
        create: {
          nodeId,
          weight: (details.weight as string) || null,
          value: (details.value as string) || null,
          rarity: (details.rarity as string) || null,
          itemType: (details.itemType as string) || null,
          requiresAttunement: Boolean(details.requiresAttunement),
          abilities: (details.abilities as string) || null,
        },
        update: {
          weight: details.weight as string | undefined,
          value: details.value as string | undefined,
          rarity: details.rarity as string | undefined,
          itemType: details.itemType as string | undefined,
          requiresAttunement: details.requiresAttunement != null ? Boolean(details.requiresAttunement) : undefined,
          abilities: details.abilities as string | undefined,
        },
      });
    case "LOCATION":
      return tx.locationDetail.upsert({
        where: { nodeId },
        create: {
          nodeId,
          region: (details.region as string) || null,
          climate: (details.climate as string) || null,
          population: (details.population as string) || null,
          locationType: (details.locationType as any) || "POINT_OF_INTEREST",
        },
        update: {
          region: details.region as string | undefined,
          climate: details.climate as string | undefined,
          population: details.population as string | undefined,
          locationType: details.locationType as any | undefined,
        },
      });
    default:
      return null;
  }
}

// GET /api/campaigns/:campaignId/nodes — list nodes in campaign
router.get("/campaign/:campaignId", async (req, res) => {
  const { campaignId } = req.params;
  const userId = req.user!.userId;

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  const isMember =
    campaign.dmId === userId ||
    (await prisma.campaignMember.findFirst({
      where: { campaignId, userId },
    }));

  if (!isMember) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const nodes = await prisma.node.findMany({
    where: {
      campaignId,
      ...buildNodeVisibilityFilter(campaign.dmId, userId),
    },
    include: {
      owner: { select: { id: true, displayName: true } },
      tags: true,
      ...detailInclude("ARC"), // we need a way to include all possible details
    },
    orderBy: [{ type: "asc" }, { title: "asc" }],
  });

  res.json(nodes);
});

// POST /api/campaigns/:campaignId/nodes — create node
router.post("/campaign/:campaignId", async (req, res) => {
  const { campaignId } = req.params;
  const userId = req.user!.userId;

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  const isMember =
    campaign.dmId === userId ||
    (await prisma.campaignMember.findFirst({
      where: { campaignId, userId },
    }));

  if (!isMember) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const parse = createNodeSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const { type, title, excerpt, visibility, parentId, details } = parse.data;

  try {
    const node = await prisma.$transaction(async (tx) => {
      const created = await tx.node.create({
        data: {
          type,
          title,
          excerpt: excerpt || null,
          visibility,
          ownerId: userId,
          campaignId,
          parentId: parentId || null,
        },
        include: {
          owner: { select: { id: true, displayName: true } },
          tags: true,
        },
      });

      if (details && Object.keys(details).length > 0) {
        await createDetail(tx, created.id, type, details);
      }

      return created;
    });

    // Re-fetch with detail included
    const fullNode = await prisma.node.findUnique({
      where: { id: node.id },
      include: {
        owner: { select: { id: true, displayName: true } },
        tags: true,
        ...detailInclude(type),
      },
    });

    res.status(201).json(fullNode);
  } catch (err) {
    console.error("Create node error:", err);
    res.status(500).json({ error: "Failed to create node" });
  }
});

// GET /api/nodes/:id — get single node
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const node = await prisma.node.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, displayName: true } },
      campaign: { select: { id: true, name: true, dmId: true } },
      parent: { select: { id: true, title: true, type: true } },
      children: { select: { id: true, title: true, type: true } },
      tags: true,
      arcDetail: true,
      sessionDetail: true,
      characterDetail: true,
      creatureDetail: true,
      itemDetail: true,
      locationDetail: true,
      outgoingLinks: {
        include: {
          target: { select: { id: true, title: true, type: true } },
        },
      },
      incomingLinks: {
        include: {
          source: { select: { id: true, title: true, type: true } },
        },
      },
    },
  });

  if (!node) {
    res.status(404).json({ error: "Node not found" });
    return;
  }

  // Visibility check
  const isOwner = node.ownerId === userId;
  const isDm = node.campaign?.dmId === userId;
  const isVisible =
    node.visibility === "PUBLIC" ||
    (node.visibility === "PRIVATE" && isOwner) ||
    (node.visibility === "DM_ONLY" && isDm);

  if (!isVisible) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  // Filter blocks by visibility
  const blocks = await prisma.nodeBlock.findMany({
    where: {
      nodeId: id,
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

  res.json({ ...node, blocks });
});

// PATCH /api/nodes/:id — update node
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const node = await prisma.node.findUnique({
    where: { id },
    include: { campaign: { select: { dmId: true } } },
  });

  if (!node) {
    res.status(404).json({ error: "Node not found" });
    return;
  }

  const isOwner = node.ownerId === userId;
  const isDm = node.campaign?.dmId === userId;
  if (!isOwner && !isDm) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const parse = updateNodeSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const { title, excerpt, visibility, parentId, details } = parse.data;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const nodeUpdate = await tx.node.update({
        where: { id },
        data: {
          title: title ?? undefined,
          excerpt: excerpt !== undefined ? excerpt || null : undefined,
          visibility: visibility ?? undefined,
          parentId: parentId !== undefined ? parentId : undefined,
        },
      });

      if (details && Object.keys(details).length > 0) {
        await updateDetail(tx, id, node.type, details);
      }

      return nodeUpdate;
    });

    // Re-fetch full node
    const fullNode = await prisma.node.findUnique({
      where: { id: updated.id },
      include: {
        owner: { select: { id: true, displayName: true } },
        campaign: { select: { id: true, name: true, dmId: true } },
        parent: { select: { id: true, title: true, type: true } },
        children: { select: { id: true, title: true, type: true } },
        tags: true,
        arcDetail: true,
        sessionDetail: true,
        characterDetail: true,
        creatureDetail: true,
        itemDetail: true,
        locationDetail: true,
        outgoingLinks: {
          include: {
            target: { select: { id: true, title: true, type: true } },
          },
        },
        incomingLinks: {
          include: {
            source: { select: { id: true, title: true, type: true } },
          },
        },
      },
    });

    // Filter blocks
    const blocks = await prisma.nodeBlock.findMany({
      where: {
        nodeId: id,
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

    res.json({ ...fullNode!, blocks });
  } catch (err) {
    console.error("Update node error:", err);
    res.status(500).json({ error: "Failed to update node" });
  }
});

// DELETE /api/nodes/:id — delete node
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const node = await prisma.node.findUnique({
    where: { id },
    include: { campaign: { select: { dmId: true } } },
  });

  if (!node) {
    res.status(404).json({ error: "Node not found" });
    return;
  }

  const isOwner = node.ownerId === userId;
  const isDm = node.campaign?.dmId === userId;
  if (!isOwner && !isDm) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  await prisma.node.delete({ where: { id } });
  res.json({ message: "Node deleted" });
});

export default router;
