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

// All campaign routes require auth
router.use(requireAuth);

// Helper: build visibility filter for nodes
function nodeVisibilityFilter(campaignDmId: string, userId: string) {
  const isDm = campaignDmId === userId;
  if (isDm) {
    return {};
  }
  return {
    OR: [
      { visibility: "PUBLIC" as const },
      { ownerId: userId, visibility: "PRIVATE" as const },
    ],
  };
}

// POST /api/campaigns — create campaign, caller becomes DM
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
      dm: { select: { id: true, email: true, displayName: true } },
      members: {
        include: {
          user: { select: { id: true, email: true, displayName: true } },
        },
      },
      _count: { select: { members: true } },
    },
  });

  res.status(201).json(campaign);
});

// GET /api/campaigns/my — list campaigns where user is DM or member
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
      dm: { select: { id: true, email: true, displayName: true } },
      members: {
        include: {
          user: { select: { id: true, email: true, displayName: true } },
        },
      },
      _count: { select: { members: true, nodes: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  res.json(campaigns);
});

// GET /api/campaigns/:id — get campaign detail with members and nodes
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      dm: { select: { id: true, email: true, displayName: true } },
      members: {
        include: {
          user: { select: { id: true, email: true, displayName: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  // Check if user has access (is DM or member)
  const isDm = campaign.dmId === userId;
  const isMember = campaign.members.some((m) => m.userId === userId);
  if (!isDm && !isMember) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  // Fetch nodes with visibility filter
  const nodes = await prisma.node.findMany({
    where: {
      campaignId: id,
      ...nodeVisibilityFilter(campaign.dmId, userId),
    },
    include: {
      owner: { select: { id: true, displayName: true } },
      tags: true,
      _count: { select: { blocks: true } },
    },
    orderBy: [{ type: "asc" }, { title: "asc" }],
  });

  res.json({ ...campaign, nodes });
});

// PATCH /api/campaigns/:id — update campaign (DM only)
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
      dm: { select: { id: true, email: true, displayName: true } },
      members: {
        include: {
          user: { select: { id: true, email: true, displayName: true } },
        },
      },
    },
  });

  res.json(updated);
});

// DELETE /api/campaigns/:id — delete campaign (DM only)
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

// POST /api/campaigns/:id/members — add member by email (DM only)
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

  const { email, role } = parse.data;

  const targetUser = await prisma.user.findUnique({ where: { email } });
  if (!targetUser) {
    res.status(404).json({ error: "User not found" });
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
      user: { select: { id: true, email: true, displayName: true } },
    },
  });

  res.status(201).json(member);
});

// DELETE /api/campaigns/:id/members/:userId — remove member (DM only)
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

// PATCH /api/campaigns/:id/members/:userId — update member role (DM only)
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
      user: { select: { id: true, email: true, displayName: true } },
    },
  });

  res.json(member);
});

export default router;
