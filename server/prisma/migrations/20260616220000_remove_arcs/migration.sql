-- Remove all ARC nodes first so the enum alteration succeeds.
-- Cascading deletes clean up related blocks, links, tags, and detail records.
DELETE FROM "Node" WHERE type = 'ARC';

-- Drop the ArcDetail table and its constraints.
DROP TABLE "ArcDetail";

-- Replace the NodeType enum with a version that does not include ARC.
CREATE TYPE "NodeType_new" AS ENUM ('SESSION', 'CHARACTER', 'CREATURE', 'ITEM', 'LOCATION', 'NOTE', 'FACTION');
ALTER TABLE "Node" ALTER COLUMN type TYPE "NodeType_new" USING type::text::"NodeType_new";
DROP TYPE "NodeType";
ALTER TYPE "NodeType_new" RENAME TO "NodeType";
