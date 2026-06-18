"use strict";
/**
 * routes/calendars.ts
 *
 * Router for campaign-specific custom calendars.
 *
 * A campaign has at most one calendar. The calendar defines ages (epochs),
 * months, weekdays, and lunar cycles. Sessions and (future) event nodes can
 * store dates in this calendar system.
 *
 * Read access: any campaign member.
 * Write access: DM or LOREMASTER.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../lib/validation");
const router = (0, express_1.Router)({ mergeParams: true });
// All calendar routes require authentication.
router.use(auth_1.requireAuth);
/**
 * Check whether the caller is allowed to manage the campaign's calendar.
 *
 * DM and LOREMASTER roles may edit; plain players may only read.
 */
async function canManageCalendar(campaignId, userId) {
    const campaign = await db_1.prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { members: { where: { userId } } },
    });
    if (!campaign)
        return false;
    if (campaign.dmId === userId)
        return true;
    const member = campaign.members[0];
    return member?.role === "LOREMASTER";
}
/**
 * Check whether the caller can view the campaign's calendar.
 *
 * DM and members may read.
 */
async function canViewCalendar(campaignId, userId) {
    const campaign = await db_1.prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { members: { where: { userId } } },
    });
    if (!campaign)
        return false;
    return campaign.dmId === userId || campaign.members.length > 0;
}
/**
 * GET /api/campaigns/:campaignId/calendar
 *
 * Return the campaign's calendar with ages, months, and moons.
 *
 * Accessible to any campaign member.
 */
router.get("/", async (req, res) => {
    const { campaignId } = req.params;
    const userId = req.user.userId;
    if (!(await canViewCalendar(campaignId, userId))) {
        res.status(403).json({ error: "Access denied" });
        return;
    }
    const calendar = await db_1.prisma.campaignCalendar.findUnique({
        where: { campaignId },
        include: {
            ages: { orderBy: { order: "asc" } },
            months: { orderBy: { order: "asc" } },
            moons: { orderBy: { order: "asc" } },
        },
    });
    if (!calendar) {
        res.status(404).json({ error: "Calendar not found" });
        return;
    }
    res.json(calendar);
});
/**
 * POST /api/campaigns/:campaignId/calendar
 *
 * Create or fully replace a campaign's calendar definition.
 *
 * The payload contains the calendar header plus the complete lists of ages,
 * months, and moons. Existing ages/months/moons not present in the payload are
 * deleted. IDs on nested items indicate updates; omitted IDs indicate creation.
 *
 * Only DM or LOREMASTER may call this endpoint.
 */
router.post("/", async (req, res) => {
    const { campaignId } = req.params;
    const userId = req.user.userId;
    if (!(await canManageCalendar(campaignId, userId))) {
        res.status(403).json({ error: "Access denied" });
        return;
    }
    const parse = validation_1.campaignCalendarSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ error: parse.error.flatten() });
        return;
    }
    const { name, daysInWeek, weekdayNames, anchorAgeId, anchorMonthId, anchorDay, anchorWeekdayIndex, ages, months, moons } = parse.data;
    // Validate that anchor ids, if provided, belong to the submitted lists.
    const ageIds = new Set(ages.map((a) => a.id).filter(Boolean));
    const monthIds = new Set(months.map((m) => m.id).filter(Boolean));
    if (anchorAgeId && !ageIds.has(anchorAgeId)) {
        res.status(400).json({ error: "Anchor age must be one of the submitted ages" });
        return;
    }
    if (anchorMonthId && !monthIds.has(anchorMonthId)) {
        res.status(400).json({ error: "Anchor month must be one of the submitted months" });
        return;
    }
    for (const moon of moons) {
        if (moon.anchorAgeId && !ageIds.has(moon.anchorAgeId)) {
            res.status(400).json({ error: `Moon ${moon.name}: anchor age must be one of the submitted ages` });
            return;
        }
        if (moon.anchorMonthId && !monthIds.has(moon.anchorMonthId)) {
            res.status(400).json({ error: `Moon ${moon.name}: anchor month must be one of the submitted months` });
            return;
        }
    }
    try {
        const calendar = await db_1.prisma.$transaction(async (tx) => {
            // Upsert the calendar header.
            const header = await tx.campaignCalendar.upsert({
                where: { campaignId },
                create: {
                    campaignId,
                    name,
                    daysInWeek,
                    weekdayNames,
                    anchorAgeId,
                    anchorMonthId,
                    anchorDay,
                    anchorWeekdayIndex,
                },
                update: {
                    name,
                    daysInWeek,
                    weekdayNames,
                    anchorAgeId,
                    anchorMonthId,
                    anchorDay,
                    anchorWeekdayIndex,
                },
            });
            // Replace ages: delete existing not in payload, upsert the rest.
            const ageIdSet = new Set(ages.map((a) => a.id).filter((id) => !!id));
            await tx.calendarAge.deleteMany({
                where: { calendarId: header.id, id: { notIn: Array.from(ageIdSet) } },
            });
            for (const age of ages) {
                const data = {
                    calendarId: header.id,
                    name: age.name,
                    startYear: age.startYear,
                    endYear: age.endYear,
                    order: age.order,
                };
                if (age.id) {
                    await tx.calendarAge.upsert({
                        where: { id: age.id },
                        update: data,
                        create: { id: age.id, ...data },
                    });
                }
                else {
                    await tx.calendarAge.create({ data });
                }
            }
            // Replace months.
            const monthIdSet = new Set(months.map((m) => m.id).filter((id) => !!id));
            await tx.calendarMonth.deleteMany({
                where: { calendarId: header.id, id: { notIn: Array.from(monthIdSet) } },
            });
            for (const month of months) {
                const data = {
                    calendarId: header.id,
                    name: month.name,
                    days: month.days,
                    order: month.order,
                };
                if (month.id) {
                    await tx.calendarMonth.upsert({
                        where: { id: month.id },
                        update: data,
                        create: { id: month.id, ...data },
                    });
                }
                else {
                    await tx.calendarMonth.create({ data });
                }
            }
            // Replace moons.
            const moonIdSet = new Set(moons.map((m) => m.id).filter((id) => !!id));
            await tx.calendarMoon.deleteMany({
                where: { calendarId: header.id, id: { notIn: Array.from(moonIdSet) } },
            });
            for (const moon of moons) {
                const data = {
                    calendarId: header.id,
                    name: moon.name,
                    cycleLength: moon.cycleLength,
                    anchorAgeId: moon.anchorAgeId,
                    anchorMonthId: moon.anchorMonthId,
                    anchorDay: moon.anchorDay,
                    order: moon.order,
                };
                if (moon.id) {
                    await tx.calendarMoon.upsert({
                        where: { id: moon.id },
                        update: data,
                        create: { id: moon.id, ...data },
                    });
                }
                else {
                    await tx.calendarMoon.create({ data });
                }
            }
            return header;
        });
        // Re-fetch with relations for the response.
        const fullCalendar = await db_1.prisma.campaignCalendar.findUnique({
            where: { id: calendar.id },
            include: {
                ages: { orderBy: { order: "asc" } },
                months: { orderBy: { order: "asc" } },
                moons: { orderBy: { order: "asc" } },
            },
        });
        res.status(201).json(fullCalendar);
    }
    catch (err) {
        console.error("Calendar upsert error:", err);
        res.status(500).json({ error: "Failed to save calendar" });
    }
});
exports.default = router;
