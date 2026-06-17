import {
  PrismaClient,
  CampaignRole,
  NodeType,
  Visibility,
  BlockType,
  LocationType,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  // ─── Create Users ─────────────────────────────────────────
  const dmPassword = await bcrypt.hash("password123", SALT_ROUNDS);
  const playerPassword = await bcrypt.hash("password123", SALT_ROUNDS);

  const dm = await prisma.user.create({
    data: {
      email: "dm@example.com",
      passwordHash: dmPassword,
      displayName: "The DM",
    },
  });

  const player = await prisma.user.create({
    data: {
      email: "player@example.com",
      passwordHash: playerPassword,
      displayName: "AragornFan",
    },
  });

  // ─── Create Campaign ──────────────────────────────────────
  const campaign = await prisma.campaign.create({
    data: {
      name: "Shadows of Westbridge",
      description: "A grimdark campaign of politics and peril.",
      dmId: dm.id,
      members: {
        create: [{ userId: player.id, role: CampaignRole.PLAYER }],
      },
    },
  });

  // ─── Create Sessions ──────────────────────────────────────
  const session1 = await prisma.node.create({
    data: {
      type: NodeType.SESSION,
      title: "Session 1: The Tavern Job",
      excerpt: "The party meets in a tavern and takes a risky contract.",
      ownerId: dm.id,
      campaignId: campaign.id,
      visibility: Visibility.PUBLIC,
      sessionDetail: {
        create: {
          sessionNumber: 1,
          campaignId: campaign.id,
        },
      },
    },
  });

  const session2 = await prisma.node.create({
    data: {
      type: NodeType.SESSION,
      title: "Session 2: Into the Sewers",
      excerpt:
        "The party descends beneath the city to find the missing courier.",
      ownerId: dm.id,
      campaignId: campaign.id,
      visibility: Visibility.PUBLIC,
      sessionDetail: {
        create: {
          sessionNumber: 2,
          campaignId: campaign.id,
        },
      },
    },
  });

  // ─── Create Characters ────────────────────────────────────
  const pc = await prisma.node.create({
    data: {
      type: NodeType.CHARACTER,
      title: "Thorin Oakenshield",
      excerpt: "A dwarven fighter with a chip on his shoulder.",
      ownerId: player.id,
      campaignId: campaign.id,
      visibility: Visibility.PUBLIC,
      characterDetail: {
        create: {
          race: "Dwarf",
          class: "Fighter",
          level: 3,
          alignment: "Lawful Good",
          isPC: true,
          physicalDescription: "Short, stocky, braided beard with iron rings.",
          personality: "Gruff but loyal. Never backs down from a challenge.",
          goals: "Reclaim his ancestral homeland.",
        },
      },
      tags: {
        create: [{ tag: "PC" }, { tag: "Dwarf" }],
      },
    },
  });

  const npc = await prisma.node.create({
    data: {
      type: NodeType.CHARACTER,
      title: "Elara Vane",
      excerpt: "The mysterious bartender who knows more than she lets on.",
      ownerId: dm.id,
      campaignId: campaign.id,
      visibility: Visibility.PUBLIC,
      characterDetail: {
        create: {
          race: "Human",
          alignment: "Neutral",
          isPC: false,
          physicalDescription: "Tall, silver-streaked hair, one milky eye.",
          personality: "Wry, observant, speaks in riddles.",
          secrets: "She is actually a retired assassin.",
        },
      },
      tags: {
        create: [{ tag: "NPC" }, { tag: "Tavern" }],
      },
    },
  });

  // ─── Create Location ──────────────────────────────────────
  const city = await prisma.node.create({
    data: {
      type: NodeType.LOCATION,
      title: "Westbridge",
      excerpt: "A crumbling port city on the edge of the empire.",
      ownerId: dm.id,
      campaignId: campaign.id,
      visibility: Visibility.PUBLIC,
      locationDetail: {
        create: {
          locationType: LocationType.CITY,
          region: "The Iron Coast",
          climate: "Temperate, foggy",
          population: "12,000",
        },
      },
    },
  });

  const tavern = await prisma.node.create({
    data: {
      type: NodeType.LOCATION,
      title: "The Rusty Anchor",
      excerpt: "A seedy dockside tavern with surprisingly good ale.",
      ownerId: dm.id,
      campaignId: campaign.id,
      visibility: Visibility.PUBLIC,
      parentId: city.id,
      locationDetail: {
        create: {
          locationType: LocationType.BUILDING,
        },
      },
    },
  });

  // ─── Create Item ──────────────────────────────────────────
  const sword = await prisma.node.create({
    data: {
      type: NodeType.ITEM,
      title: "Moonfang Blade",
      excerpt: "A curved sword that hums under starlight.",
      ownerId: dm.id,
      campaignId: campaign.id,
      visibility: Visibility.PUBLIC,
      itemDetail: {
        create: {
          rarity: "Rare",
          itemType: "Weapon",
          requiresAttunement: true,
          abilities: "Deals extra radiant damage on critical hits.",
        },
      },
    },
  });

  // ─── Create Links ─────────────────────────────────────────
  await prisma.nodeLink.createMany({
    data: [
      {
        sourceId: npc.id,
        targetId: tavern.id,
        label: "works at",
        createdBy: dm.id,
      },
      {
        sourceId: pc.id,
        targetId: city.id,
        label: "from",
        createdBy: player.id,
      },
      {
        sourceId: sword.id,
        targetId: pc.id,
        label: "owned by",
        createdBy: dm.id,
      },
      {
        sourceId: session1.id,
        targetId: tavern.id,
        label: "takes place in",
        createdBy: dm.id,
      },
    ],
  });

  // ─── Create Blocks ────────────────────────────────────────
  await prisma.nodeBlock.createMany({
    data: [
      {
        nodeId: session1.id,
        authorId: dm.id,
        type: BlockType.TEXT,
        content: { text: "The party arrived at The Rusty Anchor at dusk." },
        ordering: 0,
        visibility: Visibility.PUBLIC,
      },
      {
        nodeId: session1.id,
        authorId: player.id,
        type: BlockType.TEXT,
        content: { text: "I do not trust Elara. Her eye is too sharp." },
        ordering: 1,
        visibility: Visibility.PRIVATE,
      },
      {
        nodeId: session1.id,
        authorId: dm.id,
        type: BlockType.RICH_TEXT,
        content: {
          markdown:
            "## Combat\n\nThree thugs attacked. The party handled them easily.",
        },
        ordering: 2,
        visibility: Visibility.DM_ONLY,
      },
    ],
  });

  console.log("🌱 Seed complete.");
  console.log(`   Campaign: ${campaign.name}`);
  console.log(`   DM: ${dm.displayName}`);
  console.log(`   Player: ${player.displayName}`);
  console.log(`   Sessions: 2`);
  console.log(`   Characters: 2`);
  console.log(`   Locations: 2 (with sub-location)`);
  console.log(`   Items: 1`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
