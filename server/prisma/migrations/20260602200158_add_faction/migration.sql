-- AlterEnum
ALTER TYPE "NodeType" ADD VALUE 'FACTION';

-- CreateTable
CREATE TABLE "FactionDetail" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "factionType" TEXT,
    "description" TEXT,
    "alignment" TEXT,
    "size" TEXT,
    "reach" TEXT,
    "goals" TEXT,
    "secrets" TEXT,
    "resources" TEXT,
    "publicImage" TEXT,
    "leaderName" TEXT,
    "headquarters" TEXT,
    "influenceLevel" TEXT,

    CONSTRAINT "FactionDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FactionDetail_nodeId_key" ON "FactionDetail"("nodeId");

-- AddForeignKey
ALTER TABLE "FactionDetail" ADD CONSTRAINT "FactionDetail_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;
