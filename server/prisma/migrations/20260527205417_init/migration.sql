-- CreateEnum
CREATE TYPE "CampaignRole" AS ENUM ('PLAYER', 'LOREMASTER');

-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('ARC', 'SESSION', 'CHARACTER', 'CREATURE', 'ITEM', 'LOCATION', 'NOTE');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'PUBLIC', 'DM_ONLY');

-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('TEXT', 'RICH_TEXT', 'IMAGE');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('REGION', 'CITY', 'TOWN', 'DUNGEON', 'BUILDING', 'WILDERNESS', 'POINT_OF_INTEREST');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dmId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignMember" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CampaignRole" NOT NULL DEFAULT 'PLAYER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Node" (
    "id" TEXT NOT NULL,
    "type" "NodeType" NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "ownerId" TEXT NOT NULL,
    "campaignId" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "parentId" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeBlock" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" "BlockType" NOT NULL,
    "content" JSONB NOT NULL,
    "ordering" INTEGER NOT NULL DEFAULT 0,
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NodeBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeLink" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "label" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NodeLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeTag" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "NodeTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArcDetail" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "arcNumber" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "ArcDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionDetail" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "sessionDate" TIMESTAMP(3),
    "shortSummary" TEXT,
    "longSummary" TEXT,
    "consolidatedAt" TIMESTAMP(3),
    "campaignId" TEXT,

    CONSTRAINT "SessionDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterDetail" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "physicalDescription" TEXT,
    "gender" TEXT,
    "alignment" TEXT,
    "personality" TEXT,
    "race" TEXT,
    "class" TEXT,
    "level" INTEGER,
    "isPC" BOOLEAN NOT NULL DEFAULT false,
    "age" TEXT,
    "voice" TEXT,
    "mannerisms" TEXT,
    "goals" TEXT,
    "secrets" TEXT,
    "abilities" TEXT,

    CONSTRAINT "CharacterDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatureDetail" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "species" TEXT,
    "size" TEXT,
    "challengeRating" TEXT,
    "habitat" TEXT,
    "stats" JSONB DEFAULT '{}',
    "abilities" TEXT,

    CONSTRAINT "CreatureDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemDetail" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "weight" TEXT,
    "value" TEXT,
    "rarity" TEXT,
    "itemType" TEXT,
    "requiresAttunement" BOOLEAN NOT NULL DEFAULT false,
    "abilities" TEXT,

    CONSTRAINT "ItemDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationDetail" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "region" TEXT,
    "climate" TEXT,
    "population" TEXT,
    "locationType" "LocationType" NOT NULL DEFAULT 'POINT_OF_INTEREST',

    CONSTRAINT "LocationDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignMember_campaignId_userId_key" ON "CampaignMember"("campaignId", "userId");

-- CreateIndex
CREATE INDEX "Node_campaignId_idx" ON "Node"("campaignId");

-- CreateIndex
CREATE INDEX "Node_type_idx" ON "Node"("type");

-- CreateIndex
CREATE INDEX "Node_parentId_idx" ON "Node"("parentId");

-- CreateIndex
CREATE INDEX "NodeBlock_nodeId_idx" ON "NodeBlock"("nodeId");

-- CreateIndex
CREATE INDEX "NodeLink_sourceId_idx" ON "NodeLink"("sourceId");

-- CreateIndex
CREATE INDEX "NodeLink_targetId_idx" ON "NodeLink"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "NodeLink_sourceId_targetId_key" ON "NodeLink"("sourceId", "targetId");

-- CreateIndex
CREATE INDEX "NodeTag_nodeId_idx" ON "NodeTag"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "NodeTag_nodeId_tag_key" ON "NodeTag"("nodeId", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "ArcDetail_nodeId_key" ON "ArcDetail"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionDetail_nodeId_key" ON "SessionDetail"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterDetail_nodeId_key" ON "CharacterDetail"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatureDetail_nodeId_key" ON "CreatureDetail"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemDetail_nodeId_key" ON "ItemDetail"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "LocationDetail_nodeId_key" ON "LocationDetail"("nodeId");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_dmId_fkey" FOREIGN KEY ("dmId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignMember" ADD CONSTRAINT "CampaignMember_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignMember" ADD CONSTRAINT "CampaignMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeBlock" ADD CONSTRAINT "NodeBlock_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeBlock" ADD CONSTRAINT "NodeBlock_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeLink" ADD CONSTRAINT "NodeLink_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeLink" ADD CONSTRAINT "NodeLink_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeLink" ADD CONSTRAINT "NodeLink_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeTag" ADD CONSTRAINT "NodeTag_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArcDetail" ADD CONSTRAINT "ArcDetail_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionDetail" ADD CONSTRAINT "SessionDetail_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionDetail" ADD CONSTRAINT "SessionDetail_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterDetail" ADD CONSTRAINT "CharacterDetail_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatureDetail" ADD CONSTRAINT "CreatureDetail_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemDetail" ADD CONSTRAINT "ItemDetail_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationDetail" ADD CONSTRAINT "LocationDetail_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;
