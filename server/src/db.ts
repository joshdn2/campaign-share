/**
 * db.ts
 *
 * Database entry point for the Campaign Notes backend.
 *
 * This file creates and exports a single Prisma Client instance. Keeping one
 * shared `PrismaClient` across the application avoids exhausting database
 * connections and makes the client available to all route modules through a
 * simple import.
 */

// Import the Prisma Client generated from the schema in prisma/schema.prisma.
import { PrismaClient } from "@prisma/client";

// Shared Prisma Client instance used by all route handlers for queries,
// transactions, and aggregations against the database.
export const prisma = new PrismaClient();
