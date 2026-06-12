/**
 * routes/nodes.ts
 *
 * Router for campaign nodes.
 *
 * Nodes are the primary content units in a campaign: arcs, sessions,
 * characters, creatures, items, locations, notes, and factions. Each node type
 * has a corresponding detail table. This module handles listing, creating,
 * reading, updating, and deleting nodes, including their type-specific detail
 * records. All routes require authentication, and handlers enforce membership,
 * ownership, and visibility rules.
 */

import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { createNodeSchema, updateNodeSchema } from "../lib/validation";

const router = Router();

// Every node endpoint requires authentication.
router.use(requireAuth);

/**
 * Build a Prisma `where` fragment that filters nodes by visibility.
 *
 * The DM bypasses all visibility checks. Other members see public nodes plus
 * their own private nodes. DM-only nodes are hidden from non-DMs.
 *
 * @param campaignDmId - UUID of the campaign DM, or null if unavailable.
 * @param userId - UUID of the caller.
 * @returns A Prisma-compatible visibility filter object.
 */
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

/**
 * Return the Prisma include fragment for a node's type-specific detail record.
 *
 * Because detail tables differ per node type, this helper maps the node type
 * string to the correct relation include. It is used when fetching a node so
 * the response contains the relevant detail payload.
 *
 * @param type - Node type, e.g. "CHARACTER" or "LOCATION".
 * @returns Prisma include object for the matching detail relation.
 */
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
    case "FACTION":
      return { factionDetail: true };
    default:
      return {};
  }
}

/**
 * Create the type-specific detail record for a newly created node.
 *
 * Runs inside the Prisma transaction passed as `tx`. Each case extracts the
 * relevant fields from the flexible `details` object and stores them in the
 * matching detail table.
 *
 * @param tx - Prisma transaction client.
 * @param nodeId - UUID of the newly created node.
 * @param type - Node type.
 * @param details - Flexible key/value payload from the client.
 */
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
    case "FACTION":
      return tx.factionDetail.create({
        data: {
          nodeId,
          factionType: (details.factionType as string) || null,
          description: (details.description as string) || null,
          alignment: (details.alignment as string) || null,
          size: (details.size as string) || null,
          reach: (details.reach as string) || null,
          goals: (details.goals as string) || null,
          secrets: (details.secrets as string) || null,
          resources: (details.resources as string) || null,
          publicImage: (details.publicImage as string) || null,
          leaderName: (details.leaderName as string) || null,
          headquarters: (details.headquarters as string) || null,
          influenceLevel: (details.influenceLevel as string) || null,
        },
      });
    default:
      return null;
  }
}

/**
 * Update (or create if missing) the type-specific detail record for a node.
 *
 * Uses Prisma `upsert` so PATCH requests can add detail data to a node that did
 * not previously have any. Each branch only updates fields that are provided,
 * leaving existing values intact when omitted.
 *
 * @param tx - Prisma transaction client.
 * @param nodeId - UUID of the node being updated.
 * @param type - Node type.
 * @param details - Flexible key/value payload from the client.
 */
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
    case "FACTION":
      return tx.factionDetail.upsert({
        where: { nodeId },
        create: {
          nodeId,
          factionType: (details.factionType as string) || null,
          description: (details.description as string) || null,
          alignment: (details.alignment as string) || null,
          size: (details.size as string) || null,
          reach: (details.reach as string) || null,
          goals: (details.goals as string) || null,
          secrets: (details.secrets as string) || null,
          resources: (details.resources as string) || null,
          publicImage: (details.publicImage as string) || null,
          leaderName: (details.leaderName as string) || null,
          headquarters: (details.headquarters as string) || null,
          influenceLevel: (details.influenceLevel as string) || null,
        },
        update: {
          factionType: details.factionType as string | undefined,
          description: details.description as string | undefined,
          alignment: details.alignment as string | undefined,
          size: details.size as string | undefined,
          reach: details.reach as string | undefined,
          goals: details.goals as string | undefined,
          secrets: details.secrets as string | undefined,
          resources: details.resources as string | undefined,
          publicImage: details.publicImage as string | undefined,
          leaderName: details.leaderName as string | undefined,
          headquarters: details.headquarters as string | undefined,
          influenceLevel: details.influenceLevel as string | undefined,
        },
      });
    default:
      return null;
  }
}

/**
 * GET /api/nodes/campaign/:campaignId
 *
 * List all nodes in a campaign that the caller is allowed to see.
 *
 * Only campaign members may access this endpoint. Nodes are filtered by the
 * visibility helper so non-DM members do not see DM-only or others' private
 * nodes. The listing is sorted by node type and then title.
 */
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
      // Spread the detail include for the ARC case as a representative example;
      // the API currently returns all detail relations through other endpoints.
      ...detailInclude("ARC"),
    },
    orderBy: [{ type: "asc" }, { title: "asc" }],
  });

  res.json(nodes);
});

/**
 * POST /api/nodes/campaign/:campaignId
 *
 * Create a new node in a campaign.
 *
 * Only campaign members may create nodes. The caller becomes the node's owner.
 * Node creation and the associated detail-record creation run inside a Prisma
 * transaction so the database stays consistent.
 */
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

      // If the client supplied type-specific details, create the detail record
      // in the same transaction.
      if (details && Object.keys(details).length > 0) {
        await createDetail(tx, created.id, type, details);
      }

      return created;
    });

    // Re-fetch with detail included so the response contains the full payload.
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

/**
 * Build the chain of ancestor nodes from the root down to (but not including)
 * the requested node. This is used for breadcrumb navigation on the client.
 *
 * The schema currently supports a single parent per node, but a node may be
 * nested several levels deep. The helper walks up the hierarchy until there is
 * no parent or a cycle is detected.
 *
 * @param nodeId - Id of the node whose ancestors should be collected.
 * @returns Array of ancestor nodes ordered from root to immediate parent.
 */
async function getAncestors(nodeId: string) {
  const ancestors: Array<{ id: string; title: string; type: string }> = [];
  const seen = new Set<string>();
  let currentId: string | null = nodeId;

  while (currentId && !seen.has(currentId)) {
    seen.add(currentId);
    const current: {
      parent: { id: string; title: string; type: string } | null;
    } | null = await prisma.node.findUnique({
      where: { id: currentId },
      select: {
        parent: { select: { id: true, title: true, type: true } },
      },
    });

    if (!current?.parent) break;

    // Prepend so the root ends up first in the array.
    ancestors.unshift(current.parent);
    currentId = current.parent.id;
  }

  return ancestors;
}

/**
 * GET /api/nodes/:id
 *
 * Get a single node with all of its detail relations, hierarchy, tags, links,
 * and visible blocks.
 *
 * The caller must be allowed to view the node based on its visibility setting.
 * Blocks attached to the node are filtered separately by block visibility.
 */
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
      factionDetail: true,
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

  // Visibility check against the node itself.
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

  // Fetch the full ancestor chain for breadcrumb navigation.
  const ancestors = await getAncestors(id);

  // Filter blocks by visibility, matching the rules used in blocks.ts.
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

  res.json({ ...node, ancestors, blocks });
});

/**
 * PATCH /api/nodes/:id
 *
 * Update a node's core fields and/or its type-specific details.
 *
 * Only the node owner or the campaign DM may edit a node. The node update and
 * detail upsert run inside a transaction. After the transaction, the full node
 * is re-fetched and its visible blocks are included in the response.
 */
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

      // Upsert type-specific details when provided.
      if (details && Object.keys(details).length > 0) {
        await updateDetail(tx, id, node.type, details);
      }

      return nodeUpdate;
    });

    // Re-fetch full node with all relations so the response is complete.
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
        factionDetail: true,
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

    // Fetch the full ancestor chain for breadcrumb navigation.
    const ancestors = await getAncestors(id);

    // Filter blocks by visibility before returning them.
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

    res.json({ ...fullNode!, ancestors, blocks });
  } catch (err) {
    console.error("Update node error:", err);
    res.status(500).json({ error: "Failed to update node" });
  }
});

/**
 * DELETE /api/nodes/:id
 *
 * Permanently delete a node.
 *
 * Only the node owner or the campaign DM may delete a node. Prisma cascading
 * deletes remove the node's detail record, blocks, and links automatically.
 */
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
