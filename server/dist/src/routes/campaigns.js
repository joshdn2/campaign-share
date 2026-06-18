"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../lib/validation");
const router = (0, express_1.Router)();
// All campaign routes require authentication.
router.use(auth_1.requireAuth);
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
function nodeVisibilityFilter(campaignDmId, userId) {
    const isDm = campaignDmId === userId;
    if (isDm) {
        // Empty object means "no visibility restriction".
        return {};
    }
    return {
        OR: [
            { visibility: "PUBLIC" },
            { ownerId: userId, visibility: "PRIVATE" },
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
    const parse = validation_1.createCampaignSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ error: parse.error.flatten() });
        return;
    }
    const { name, description } = parse.data;
    const userId = req.user.userId;
    const campaign = await db_1.prisma.campaign.create({
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
/**
 * GET /api/campaigns/my
 *
 * List campaigns where the caller is either the DM or a member.
 *
 * Results include the DM, all members, and counts for members and nodes.
 * Ordered by most recently updated first.
 */
router.get("/my", async (req, res) => {
    const userId = req.user.userId;
    const campaigns = await db_1.prisma.campaign.findMany({
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
    const userId = req.user.userId;
    const campaign = await db_1.prisma.campaign.findUnique({
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
    // Check if user has access (is DM or member).
    const isDm = campaign.dmId === userId;
    const isMember = campaign.members.some((m) => m.userId === userId);
    if (!isDm && !isMember) {
        res.status(403).json({ error: "Access denied" });
        return;
    }
    // Fetch nodes with visibility filter applied.
    const nodes = await db_1.prisma.node.findMany({
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
/**
 * PATCH /api/campaigns/:id
 *
 * Update a campaign's name or description.
 *
 * Only the campaign DM may edit the campaign.
 */
router.patch("/:id", async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const campaign = await db_1.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
    }
    if (campaign.dmId !== userId) {
        res.status(403).json({ error: "Only the DM can update this campaign" });
        return;
    }
    const parse = validation_1.updateCampaignSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ error: parse.error.flatten() });
        return;
    }
    const updated = await db_1.prisma.campaign.update({
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
    const userId = req.user.userId;
    const campaign = await db_1.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
    }
    if (campaign.dmId !== userId) {
        res.status(403).json({ error: "Only the DM can delete this campaign" });
        return;
    }
    await db_1.prisma.campaign.delete({ where: { id } });
    res.json({ message: "Campaign deleted" });
});
/**
 * POST /api/campaigns/:id/members
 *
 * Add a user to the campaign by email.
 *
 * Only the DM may invite members. The target user must exist and cannot be the
 * DM themselves. Duplicate memberships are rejected with a 409 conflict.
 */
router.post("/:id/members", async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const campaign = await db_1.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
    }
    if (campaign.dmId !== userId) {
        res.status(403).json({ error: "Only the DM can manage members" });
        return;
    }
    const parse = validation_1.addMemberSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ error: parse.error.flatten() });
        return;
    }
    const { email, role } = parse.data;
    const targetUser = await db_1.prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    if (targetUser.id === campaign.dmId) {
        res.status(409).json({ error: "User is already the DM" });
        return;
    }
    const existing = await db_1.prisma.campaignMember.findUnique({
        where: { campaignId_userId: { campaignId: id, userId: targetUser.id } },
    });
    if (existing) {
        res.status(409).json({ error: "User is already a member" });
        return;
    }
    const member = await db_1.prisma.campaignMember.create({
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
    const userId = req.user.userId;
    const campaign = await db_1.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
    }
    if (campaign.dmId !== userId) {
        res.status(403).json({ error: "Only the DM can manage members" });
        return;
    }
    await db_1.prisma.campaignMember.delete({
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
    const userId = req.user.userId;
    const campaign = await db_1.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
    }
    if (campaign.dmId !== userId) {
        res.status(403).json({ error: "Only the DM can manage members" });
        return;
    }
    const parse = validation_1.updateMemberSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ error: parse.error.flatten() });
        return;
    }
    const member = await db_1.prisma.campaignMember.update({
        where: { campaignId_userId: { campaignId: id, userId: memberUserId } },
        data: { role: parse.data.role },
        include: {
            user: { select: { id: true, email: true, displayName: true } },
        },
    });
    res.json(member);
});
exports.default = router;
