/**
 * routes/nodes.ts
 *
 * Router for campaign nodes.
 *
 * Nodes are the primary content units in a campaign: sessions,
 * characters, creatures, items, locations, notes, and factions. Each node type
 * has a corresponding detail table. This module handles listing, creating,
 * reading, updating, and deleting nodes, including their type-specific detail
 * records. All routes require authentication, and handlers enforce membership,
 * ownership, and visibility rules.
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { createNodeSchema, updateNodeSchema, createNodeLinkSchema } from "../lib/validation";
import { Prisma } from "@prisma/client";

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
 * Validate a campaign id when it is provided as a query parameter.
 *
 * Returns the validated UUID or undefined. Any non-UUID value is rejected so
 * it cannot be injected into raw SQL.
 *
 * @param value - Raw campaign id from the query string.
 * @returns The validated id, or undefined if omitted/empty.
 */
function validateOptionalCampaignId(value: unknown): string | undefined {
  if (!value || typeof value !== "string") return undefined;
  const parsed = z.string().uuid().safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

/**
 * Shared CTE that returns the campaigns a user is allowed to see.
 *
 * A campaign is searchable when the caller is the DM or a member. This CTE
 * is reused by both the suggestions and full-search queries.
 */
const MEMBER_CAMPAIGNS_CTE = `
  member_campaigns AS (
    SELECT c.id AS campaign_id, c."dmId" AS dm_id
    FROM "Campaign" c
    LEFT JOIN "CampaignMember" cm ON cm."campaignId" = c.id AND cm."userId" = $1
    WHERE c."dmId" = $1 OR cm."userId" IS NOT NULL
  )
`;

/**
 * Shared CTE that returns nodes the user can see within their member campaigns,
 * optionally scoped to a single campaign. Visibility rules mirror the rest of
 * the app: public nodes, the user's own private nodes, and DM-only nodes for
 * the campaign DM.
 */
const VISIBLE_NODES_CTE = `
  visible_nodes AS (
    SELECT
      n.id, n.title, n.excerpt, n.type, n."campaignId" AS campaign_id,
      n."ownerId" AS owner_id, n.visibility, n."updatedAt" AS updated_at, mc.dm_id
    FROM "Node" n
    JOIN member_campaigns mc ON n."campaignId" = mc.campaign_id
    WHERE ($2::text IS NULL OR n."campaignId" = $2)
      AND (
        n.visibility = 'PUBLIC'
        OR (n.visibility = 'PRIVATE' AND n."ownerId" = $1)
        OR (n.visibility = 'DM_ONLY' AND mc.dm_id = $1)
      )
  )
`;

/**
 * Score constants used to rank search results.
 *
 * Title matches are weighted highest, followed by excerpt matches, then block
 * content matches. A node can accumulate points from multiple fields.
 */
const TITLE_SCORE = 3;
const EXCERPT_SCORE = 2;
const BLOCK_SCORE = 1;

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
    case "SESSION":
      return tx.sessionDetail.create({
        data: {
          nodeId,
          sessionNumber: Number(details.sessionNumber) || 1,
          sessionDate: details.sessionDate ? new Date(details.sessionDate as string) : null,
          shortSummary: (details.shortSummary as string) || null,
          longSummary: (details.longSummary as string) || null,
          campaignId: (details.campaignId as string) || null,
          startDateAgeId: (details.startDateAgeId as string) || null,
          startDateYear: details.startDateYear != null ? Number(details.startDateYear) : null,
          startDateMonthId: (details.startDateMonthId as string) || null,
          startDateDay: details.startDateDay != null ? Number(details.startDateDay) : null,
          endDateAgeId: (details.endDateAgeId as string) || null,
          endDateYear: details.endDateYear != null ? Number(details.endDateYear) : null,
          endDateMonthId: (details.endDateMonthId as string) || null,
          endDateDay: details.endDateDay != null ? Number(details.endDateDay) : null,
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
          startDateAgeId: (details.startDateAgeId as string) || null,
          startDateYear: details.startDateYear != null ? Number(details.startDateYear) : null,
          startDateMonthId: (details.startDateMonthId as string) || null,
          startDateDay: details.startDateDay != null ? Number(details.startDateDay) : null,
          endDateAgeId: (details.endDateAgeId as string) || null,
          endDateYear: details.endDateYear != null ? Number(details.endDateYear) : null,
          endDateMonthId: (details.endDateMonthId as string) || null,
          endDateDay: details.endDateDay != null ? Number(details.endDateDay) : null,
        },
        update: {
          sessionNumber: details.sessionNumber != null ? Number(details.sessionNumber) : undefined,
          sessionDate: details.sessionDate ? new Date(details.sessionDate as string) : undefined,
          shortSummary: details.shortSummary as string | undefined,
          longSummary: details.longSummary as string | undefined,
          startDateAgeId: details.startDateAgeId as string | undefined,
          startDateYear: details.startDateYear != null ? Number(details.startDateYear) : undefined,
          startDateMonthId: details.startDateMonthId as string | undefined,
          startDateDay: details.startDateDay != null ? Number(details.startDateDay) : undefined,
          endDateAgeId: details.endDateAgeId as string | undefined,
          endDateYear: details.endDateYear != null ? Number(details.endDateYear) : undefined,
          endDateMonthId: details.endDateMonthId as string | undefined,
          endDateDay: details.endDateDay != null ? Number(details.endDateDay) : undefined,
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
      // Spread the detail include for the SESSION case as a representative example;
      // the API currently returns all detail relations through other endpoints.
      ...detailInclude("SESSION"),
    },
    orderBy: [{ type: "asc" }, { title: "asc" }],
  });

  res.json(nodes);
});

/**
 * GET /api/nodes/search/suggestions
 *
 * Fast title-only suggestions for the navbar dropdown and the block tagger.
 * Returns nodes whose title contains the search term, scoped to the current
 * campaign when one is provided. Only campaigns the user belongs to are
 * considered, and node visibility rules are applied.
 *
 * Query params:
 *  - q: search term
 *  - campaignId: optional campaign scope
 *  - excludeNodeId: optional node id to exclude (used when tagging so the
 *    current node cannot tag itself)
 *  - limit: max suggestions (default 8, max 50)
 */
router.get("/search/suggestions", async (req, res) => {
  const userId = req.user!.userId;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const campaignId = validateOptionalCampaignId(req.query.campaignId);
  const excludeNodeId = validateOptionalCampaignId(req.query.excludeNodeId);
  const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 50);

  if (!q) {
    res.status(400).json({ error: "Search term is required" });
    return;
  }

  const termPattern = `%${q}%`;

  const suggestions = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      title: string;
      type: string;
      campaignId: string;
      campaignName: string;
    }>
  >(
    `
    WITH
      ${MEMBER_CAMPAIGNS_CTE},
      ${VISIBLE_NODES_CTE}
    SELECT
      n.id,
      n.title,
      n.type,
      n."campaignId" AS "campaignId",
      c.name AS "campaignName"
    FROM visible_nodes vn
    JOIN "Node" n ON n.id = vn.id
    JOIN "Campaign" c ON c.id = n."campaignId"
    WHERE n."title" ILIKE $3
      AND ($5::text IS NULL OR n.id != $5)
    ORDER BY n."title" ASC
    LIMIT $4
    `,
    userId,
    campaignId ?? null,
    termPattern,
    limit,
    excludeNodeId ?? null,
  );

  res.json({ suggestions });
});

/**
 * GET /api/nodes/search
 *
 * Full-text search across node titles, excerpts, and visible TEXT blocks.
 * Results are ranked by relevance (title > excerpt > block) and paginated.
 * The search is automatically scoped to campaigns the user is a member of,
 * with an optional campaignId filter for campaign-scoped search.
 */
router.get("/search", async (req, res) => {
  const userId = req.user!.userId;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const campaignId = validateOptionalCampaignId(req.query.campaignId);
  const page = Math.min(Math.max(Number(req.query.page) || 1, 1), 10_000);
  const requestedLimit = Number(req.query.limit) || 20;
  const limit = Math.min(Math.max(requestedLimit, 1), 100);
  const offset = (page - 1) * limit;

  if (!q) {
    res.status(400).json({ error: "Search term is required" });
    return;
  }

  const termPattern = `%${q}%`;

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      title: string;
      excerpt: string | null;
      type: string;
      campaignId: string;
      campaignName: string;
      ownerId: string;
      visibility: string;
      updatedAt: Date;
      score: number;
      matchedFields: string[];
      total: number;
    }>
  >(
    `
    WITH
      ${MEMBER_CAMPAIGNS_CTE},
      ${VISIBLE_NODES_CTE},
      title_matches AS (
        SELECT vn.*, ${TITLE_SCORE} AS score, 'title'::text AS matched_field
        FROM visible_nodes vn
        WHERE vn.title ILIKE $3
      ),
      excerpt_matches AS (
        SELECT vn.*, ${EXCERPT_SCORE} AS score, 'excerpt'::text AS matched_field
        FROM visible_nodes vn
        WHERE vn.excerpt ILIKE $3
      ),
      block_matches AS (
        SELECT DISTINCT
          vn.id, vn.title, vn.excerpt, vn.type, vn.campaign_id,
          vn.owner_id, vn.visibility, vn.updated_at, vn.dm_id,
          ${BLOCK_SCORE} AS score, 'block'::text AS matched_field
        FROM visible_nodes vn
        JOIN "NodeBlock" nb ON nb."nodeId" = vn.id
        WHERE nb.type = 'TEXT'
          AND nb.content->>'text' ILIKE $3
          AND (
            nb.visibility = 'PUBLIC'
            OR (nb.visibility = 'PRIVATE' AND nb."authorId" = $1)
            OR (nb.visibility = 'DM_ONLY' AND vn.dm_id = $1)
          )
      ),
      all_matches AS (
        SELECT * FROM title_matches
        UNION ALL
        SELECT * FROM excerpt_matches
        UNION ALL
        SELECT * FROM block_matches
      ),
      ranked AS (
        SELECT
          id,
          SUM(score) AS score,
          ARRAY_AGG(DISTINCT matched_field) AS matched_fields
        FROM all_matches
        GROUP BY id
      )
    SELECT
      n.id,
      n.title,
      n.excerpt,
      n.type,
      n."campaignId" AS "campaignId",
      c.name AS "campaignName",
      n."ownerId" AS "ownerId",
      n.visibility,
      n."updatedAt" AS "updatedAt",
      r.score,
      r.matched_fields AS "matchedFields",
      COUNT(*) OVER() AS total
    FROM ranked r
    JOIN "Node" n ON n.id = r.id
    JOIN "Campaign" c ON c.id = n."campaignId"
    ORDER BY r.score DESC, n."updatedAt" DESC
    LIMIT $4 OFFSET $5
    `,
    userId,
    campaignId ?? null,
    termPattern,
    limit,
    offset,
  );

  const total = rows.length > 0 ? Number(rows[0].total) : 0;
  const results = rows.map(({ total: _, score, updatedAt, ...rest }) => ({
    ...rest,
    score: Number(score),
    updatedAt: updatedAt.toISOString(),
  }));

  res.json({
    results,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
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
 * POST /api/nodes/:id/links
 *
 * Create a bidirectional manual link between the source node (`:id`) and the
 * target node supplied in the body.
 *
 * The caller must be able to see both nodes and must belong to their campaign.
 * The link is stored in both directions so the relationship appears on each
 * node's detail page. A unique constraint violation returns 409.
 */
router.post("/:id/links", async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const parse = createNodeLinkSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const { targetId, label } = parse.data;

  if (id === targetId) {
    res.status(400).json({ error: "A node cannot be linked to itself" });
    return;
  }

  const [sourceNode, targetNode] = await Promise.all([
    prisma.node.findUnique({
      where: { id },
      include: { campaign: { select: { id: true, dmId: true } } },
    }),
    prisma.node.findUnique({
      where: { id: targetId },
      include: { campaign: { select: { id: true, dmId: true } } },
    }),
  ]);

  if (!sourceNode || !targetNode) {
    res.status(404).json({ error: "Node not found" });
    return;
  }

  // Both nodes must live in the same campaign.
  if (!sourceNode.campaignId || sourceNode.campaignId !== targetNode.campaignId) {
    res.status(400).json({ error: "Nodes must belong to the same campaign" });
    return;
  }

  const campaignId = sourceNode.campaignId;
  const isDm = sourceNode.campaign?.dmId === userId;

  // Caller must be a campaign member (DM or accepted member).
  const isMember =
    isDm ||
    (await prisma.campaignMember.findFirst({
      where: { campaignId, userId },
    }));
  if (!isMember) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  // Both nodes must be visible to the caller.
  const canSee = (node: typeof sourceNode) =>
    node.visibility === "PUBLIC" ||
    (node.visibility === "PRIVATE" && node.ownerId === userId) ||
    (node.visibility === "DM_ONLY" && node.campaign?.dmId === userId);

  if (!canSee(sourceNode) || !canSee(targetNode)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  // Check for an existing link in either direction; the relationship is
  // undirected, so A-B is the same link as B-A.
  const existing = await prisma.nodeLink.findFirst({
    where: {
      OR: [
        { sourceId: id, targetId },
        { sourceId: targetId, targetId: id },
      ],
    },
  });
  if (existing) {
    res.status(409).json({ error: "Link already exists" });
    return;
  }

  try {
    await prisma.nodeLink.create({
      data: {
        sourceId: id,
        targetId,
        label: label || null,
        createdBy: userId,
      },
    });

    res.status(201).json({ message: "Link created" });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      res.status(409).json({ error: "Link already exists" });
      return;
    }
    console.error("Create link error:", err);
    res.status(500).json({ error: "Failed to create link" });
  }
});

/**
 * DELETE /api/nodes/:id/links/:linkId
 *
 * Delete a manual link between two nodes. The caller must be the DM, the owner
 * of either linked node, or the user who created the link.
 */
router.delete("/:id/links/:linkId", async (req, res) => {
  const { id, linkId } = req.params;
  const userId = req.user!.userId;

  const link = await prisma.nodeLink.findUnique({
    where: { id: linkId },
    include: {
      source: { include: { campaign: { select: { dmId: true } } } },
      target: { include: { campaign: { select: { dmId: true } } } },
    },
  });

  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }

  // Verify the link involves the requested node.
  if (link.sourceId !== id && link.targetId !== id) {
    res.status(400).json({ error: "Link does not belong to this node" });
    return;
  }

  const isDm =
    link.source.campaign?.dmId === userId || link.target.campaign?.dmId === userId;
  const isOwner = link.source.ownerId === userId || link.target.ownerId === userId;
  const isCreator = link.createdBy === userId;

  if (!isDm && !isOwner && !isCreator) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  await prisma.nodeLink.delete({ where: { id: linkId } });
  res.json({ message: "Link deleted" });
});

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
      sessionDetail: true,
      characterDetail: true,
      creatureDetail: true,
      itemDetail: true,
      locationDetail: true,
      factionDetail: true,
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

  // Links are undirected; filter out any linked node the caller cannot see.
  const linkedNodeVisibilityFilter = buildNodeVisibilityFilter(
    node.campaign?.dmId ?? null,
    userId,
  );

  const [outgoingLinks, incomingLinks] = await Promise.all([
    prisma.nodeLink.findMany({
      where: { sourceId: id, target: linkedNodeVisibilityFilter },
      include: {
        target: { select: { id: true, title: true, type: true } },
      },
    }),
    prisma.nodeLink.findMany({
      where: { targetId: id, source: linkedNodeVisibilityFilter },
      include: {
        source: { select: { id: true, title: true, type: true } },
      },
    }),
  ]);

  res.json({ ...node, outgoingLinks, incomingLinks, ancestors, blocks });
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
        sessionDetail: true,
        characterDetail: true,
        creatureDetail: true,
        itemDetail: true,
        locationDetail: true,
        factionDetail: true,
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

    // Links are undirected; filter out any linked node the caller cannot see.
    const linkedNodeVisibilityFilter = buildNodeVisibilityFilter(
      fullNode!.campaign?.dmId ?? null,
      userId,
    );

    const [outgoingLinks, incomingLinks] = await Promise.all([
      prisma.nodeLink.findMany({
        where: { sourceId: id, target: linkedNodeVisibilityFilter },
        include: {
          target: { select: { id: true, title: true, type: true } },
        },
      }),
      prisma.nodeLink.findMany({
        where: { targetId: id, source: linkedNodeVisibilityFilter },
        include: {
          source: { select: { id: true, title: true, type: true } },
        },
      }),
    ]);

    res.json({ ...fullNode!, outgoingLinks, incomingLinks, ancestors, blocks });
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
