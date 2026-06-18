"use strict";
/**
 * db.ts
 *
 * Database entry point for the CampaignShare backend.
 *
 * This file creates and exports a single Prisma Client instance. Keeping one
 * shared `PrismaClient` across the application avoids exhausting database
 * connections and makes the client available to all route modules through a
 * simple import.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// Import the Prisma Client generated from the schema in prisma/schema.prisma.
const client_1 = require("@prisma/client");
// Shared Prisma Client instance used by all route handlers for queries,
// transactions, and aggregations against the database.
exports.prisma = new client_1.PrismaClient();
