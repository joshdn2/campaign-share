/*
  The original init migration created the User table with a `displayName` column.
  The application schema was later updated to use `username` instead. This
  migration adds `username`, copies existing display names into it, enforces
  uniqueness, and then removes the old `displayName` column.
*/

-- Add the new username column (nullable first so we can backfill data).
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Copy existing display names into the new username column.
UPDATE "User" SET "username" = "displayName" WHERE "username" IS NULL;

-- Enforce the unique constraint that the Prisma schema requires.
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Make username required now that all rows have a value.
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

-- Remove the old column that the schema no longer references.
ALTER TABLE "User" DROP COLUMN "displayName";
