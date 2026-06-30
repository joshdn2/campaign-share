/**
 * routes/campaigns.ts
 *
 * Router for campaign management.
 *
 * Campaigns are the top-level container for nodes, members, and blocks. This
 * module handles creating campaigns, listing a user's campaigns, reading and
 * updating campaign details, and managing campaign membership. All routes are
 * protected by requireAuth, and DM-only actions check that the caller is the
 * campaign's dmId.
 */

import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import {
  createCampaignSchema,
  updateCampaignSchema,
  addMemberSchema,
  updateMemberSchema,
} from "../lib/validation";

const router = Router();

// All campaign routes require authentication.
router.use(requireAuth);

/**
 * Build a Prisma `where` fragment that filters nodes by visibility.
 *
 * The DM sees every node in the campaign. Non-DM members see public nodes and
 * their own private nodes; DM-only nodes are hidden from them.
 *
 * @param campaignDmId - UUID of the campaign's Dungeon Master.
 * @param userId - UUID of the caller.
 * @returns A Prisma-compatible object for the `where.OR` filter.
 */
function nodeVisibilityFilter(campaignDmId: string, userId: string) {
  const isDm = campaignDmId === userId;
  if (isDm) {
    // Empty object means "no visibility restriction".
    return {};
  }
  return {
    OR: [
      { visibility: "PUBLIC" as const },
      { ownerId: userId, visibility: "PRIVATE" as const },
    ],
  };
}

/**
 * POST /api/campaigns
 *
 * Create a new campaign. The authenticated caller automatically becomes the
 * campaign's Dungeon Master (DM).
 */
router.post("/", async (req, res) => {
  const parse = createCampaignSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const { name, description } = parse.data;
  const userId = req.user!.userId;

  const campaign = await prisma.campaign.create({
    data: {
      name,
      description,
      dmId: userId,
    },
    include: {
      dm: { select: { id: true, email: true, username: true } },
      members: {
        include: {
          user: { select: { id: true, email: true, username: true } },
        },
      },
      _count: { select: { members: true } },
    },
  });

  res.status(201).json(campaign);
});

/**
 * GET /api/campaigns/my
 *
 * List campaigns where the caller is either the DM or a member.
 *
 * Results include the DM, all members, and counts for members and nodes.
 * Ordered by most recently updated first.
 */
router.get("/my", async (req, res) => {
  const userId = req.user!.userId;

  const campaigns = await prisma.campaign.findMany({
    where: {
      OR: [
        { dmId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      dm: { select: { id: true, email: true, username: true } },
      members: {
        include: {
          user: { select: { id: true, email: true, username: true } },
        },
      },
      _count: { select: { members: true, nodes: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  res.json(campaigns);
});

/**
 * GET /api/campaigns/:id
 *
 * Get full details for a single campaign, including members and nodes.
 *
 * Access is restricted to the DM and existing members. Nodes are filtered
 * through nodeVisibilityFilter so members only see what they are allowed to.
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      dm: { select: { id: true, email: true, username: true } },
      members: {
        include: {
          user: { select: { id: true, email: true, username: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  // Check if user has access (is DM or member).
  const isDm = campaign.dmId === userId;
  const isMember = campaign.members.some((m) => m.userId === userId);
  if (!isDm && !isMember) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  // Fetch nodes with visibility filter applied.
  const nodes = await prisma.node.findMany({
    where: {
      campaignId: id,
      ...nodeVisibilityFilter(campaign.dmId, userId),
    },
    include: {
      owner: { select: { id: true, username: true } },
      tags: true,
      _count: { select: { blocks: true } },
    },
    orderBy: [{ type: "asc" }, { title: "asc" }],
  });

  res.json({ ...campaign, nodes });
});

/**
 * PATCH /api/campaigns/:id
 *
 * Update a campaign's name or description.
 *
 * Only the campaign DM may edit the campaign.
 */
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  if (campaign.dmId !== userId) {
    res.status(403).json({ error: "Only the DM can update this campaign" });
    return;
  }

  const parse = updateCampaignSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const updated = await prisma.campaign.update({
    where: { id },
    data: parse.data,
    include: {
      dm: { select: { id: true, email: true, username: true } },
      members: {
        include: {
          user: { select: { id: true, email: true, username: true } },
        },
      },
    },
  });

  res.json(updated);
});

/**
 * DELETE /api/campaigns/:id
 *
 * Permanently delete a campaign and all dependent records.
 *
 * Only the campaign DM may delete it. Prisma's cascading deletes handle
 * members, nodes, blocks, and detail records.
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  if (campaign.dmId !== userId) {
    res.status(403).json({ error: "Only the DM can delete this campaign" });
    return;
  }

  await prisma.campaign.delete({ where: { id } });
  res.json({ message: "Campaign deleted" });
});

/**
 * POST /api/campaigns/:id/members
 *
 * Add an existing user to the campaign by email or username (display name).
 *
 * Only the DM may invite members. The target user must exist and cannot be the
 * DM themselves. Duplicate memberships are rejected with a 409 conflict.
 */
router.post("/:id/members", async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  if (campaign.dmId !== userId) {
    res.status(403).json({ error: "Only the DM can manage members" });
    return;
  }

  const parse = addMemberSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const { identifierType, identifier, role } = parse.data;

  const targetUser =
    identifierType === "email"
      ? await prisma.user.findUnique({
          where: { email: identifier },
          select: { id: true, email: true, username: true },
        })
      : await prisma.user.findFirst({
          where: {
            username: { equals: identifier, mode: "insensitive" },
          },
          select: { id: true, email: true, username: true },
        });

  if (!targetUser) {
    const notFoundMessage =
      identifierType === "email"
        ? "User not found. Make sure they already have an account and try their email address."
        : "User not found. Make sure the username is correct.";
    res.status(404).json({ error: notFoundMessage });
    return;
  }
  if (targetUser.id === campaign.dmId) {
    res.status(409).json({ error: "User is already the DM" });
    return;
  }

  const existing = await prisma.campaignMember.findUnique({
    where: { campaignId_userId: { campaignId: id, userId: targetUser.id } },
  });
  if (existing) {
    res.status(409).json({ error: "User is already a member" });
    return;
  }

  const member = await prisma.campaignMember.create({
    data: {
      campaignId: id,
      userId: targetUser.id,
      role,
    },
    include: {
      user: { select: { id: true, email: true, username: true } },
    },
  });

  res.status(201).json(member);
});

/**
 * DELETE /api/campaigns/:id/members/:memberUserId
 *
 * Remove a member from the campaign.
 *
 * Only the DM may remove members. The deletion uses the composite primary key
 * campaignId_userId.
 */
router.delete("/:id/members/:memberUserId", async (req, res) => {
  const { id, memberUserId } = req.params;
  const userId = req.user!.userId;

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  if (campaign.dmId !== userId) {
    res.status(403).json({ error: "Only the DM can manage members" });
    return;
  }

  await prisma.campaignMember.delete({
    where: { campaignId_userId: { campaignId: id, userId: memberUserId } },
  });

  res.json({ message: "Member removed" });
});

/**
 * PATCH /api/campaigns/:id/members/:memberUserId
 *
 * Update a member's role (PLAYER or LOREMASTER).
 *
 * Only the DM may change member roles.
 */
router.patch("/:id/members/:memberUserId", async (req, res) => {
  const { id, memberUserId } = req.params;
  const userId = req.user!.userId;

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  if (campaign.dmId !== userId) {
    res.status(403).json({ error: "Only the DM can manage members" });
    return;
  }

  const parse = updateMemberSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const member = await prisma.campaignMember.update({
    where: { campaignId_userId: { campaignId: id, userId: memberUserId } },
    data: { role: parse.data.role },
    include: {
      user: { select: { id: true, email: true, username: true } },
    },
  });

  res.json(member);
});

export default router;
