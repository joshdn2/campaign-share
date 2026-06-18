-- AlterTable
ALTER TABLE "SessionDetail" ADD COLUMN     "endDateAgeId" TEXT,
ADD COLUMN     "endDateDay" INTEGER,
ADD COLUMN     "endDateMonthId" TEXT,
ADD COLUMN     "endDateYear" INTEGER,
ADD COLUMN     "startDateAgeId" TEXT,
ADD COLUMN     "startDateDay" INTEGER,
ADD COLUMN     "startDateMonthId" TEXT,
ADD COLUMN     "startDateYear" INTEGER;

-- CreateTable
CREATE TABLE "CampaignCalendar" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "daysInWeek" INTEGER NOT NULL DEFAULT 7,
    "weekdayNames" TEXT[],
    "anchorAgeId" TEXT,
    "anchorMonthId" TEXT,
    "anchorDay" INTEGER,
    "anchorWeekdayIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarAge" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startYear" INTEGER NOT NULL DEFAULT 0,
    "endYear" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CalendarAge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarMonth" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CalendarMonth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarMoon" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cycleLength" INTEGER NOT NULL,
    "anchorAgeId" TEXT,
    "anchorMonthId" TEXT,
    "anchorDay" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CalendarMoon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignCalendar_campaignId_key" ON "CampaignCalendar"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignCalendar_campaignId_idx" ON "CampaignCalendar"("campaignId");

-- CreateIndex
CREATE INDEX "CalendarAge_calendarId_idx" ON "CalendarAge"("calendarId");

-- CreateIndex
CREATE INDEX "CalendarMonth_calendarId_idx" ON "CalendarMonth"("calendarId");

-- CreateIndex
CREATE INDEX "CalendarMoon_calendarId_idx" ON "CalendarMoon"("calendarId");

-- AddForeignKey
ALTER TABLE "CampaignCalendar" ADD CONSTRAINT "CampaignCalendar_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarAge" ADD CONSTRAINT "CalendarAge_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "CampaignCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarMonth" ADD CONSTRAINT "CalendarMonth_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "CampaignCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarMoon" ADD CONSTRAINT "CalendarMoon_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "CampaignCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
