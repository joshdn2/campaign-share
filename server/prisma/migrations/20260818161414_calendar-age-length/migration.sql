-- Add the new age columns first so existing startYear/endYear data can be
-- converted before the old columns are dropped.
ALTER TABLE "CalendarAge"
  ADD COLUMN "length" INTEGER,
  ADD COLUMN "hasYearZero" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "isCurrent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "currentYear" INTEGER;

-- Convert existing rows:
-- - ended ages: length = endYear - startYear + 1
-- - ages that counted a year 0 had startYear = 0
-- - open-ended ages (no endYear) become the current age; currentYear defaults
--   to their old startYear so the calendar continues from where it was.
UPDATE "CalendarAge" SET
  "length" = CASE WHEN "endYear" IS NOT NULL THEN "endYear" - "startYear" + 1 END,
  "hasYearZero" = ("startYear" = 0),
  "isCurrent" = ("endYear" IS NULL),
  "currentYear" = CASE WHEN "endYear" IS NULL THEN "startYear" END;

ALTER TABLE "CalendarAge"
  DROP COLUMN "endYear",
  DROP COLUMN "startYear";
