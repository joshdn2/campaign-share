// ─── Auth ─────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

// ─── Campaigns ────────────────────────────────────────

export type CampaignRole = "PLAYER" | "LOREMASTER";
export type Visibility = "PRIVATE" | "PUBLIC" | "DM_ONLY";
export type NodeType = "ARC" | "SESSION" | "CHARACTER" | "CREATURE" | "ITEM" | "LOCATION" | "NOTE";
export type BlockType = "TEXT" | "RICH_TEXT" | "IMAGE";
export type LocationType = "REGION" | "CITY" | "TOWN" | "DUNGEON" | "BUILDING" | "WILDERNESS" | "POINT_OF_INTEREST";

export interface CampaignMember {
  id: string;
  campaignId: string;
  userId: string;
  role: CampaignRole;
  joinedAt: string;
  user: User;
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  dmId: string;
  createdAt: string;
  updatedAt: string;
  dm: User;
  members: CampaignMember[];
  nodes?: Node[];
  _count?: {
    members: number;
    nodes: number;
  };
}

// ─── Nodes ────────────────────────────────────────────

export interface NodeTag {
  id: string;
  nodeId: string;
  tag: string;
}

export interface NodeLink {
  id: string;
  sourceId: string;
  targetId: string;
  label: string | null;
  createdBy: string;
  createdAt: string;
  target?: { id: string; title: string; type: NodeType };
  source?: { id: string; title: string; type: NodeType };
}

export interface ArcDetail {
  id: string;
  nodeId: string;
  arcNumber: number;
  description: string | null;
}

export interface SessionDetail {
  id: string;
  nodeId: string;
  sessionNumber: number;
  sessionDate: string | null;
  shortSummary: string | null;
  longSummary: string | null;
  consolidatedAt: string | null;
  campaignId: string | null;
}

export interface CharacterDetail {
  id: string;
  nodeId: string;
  physicalDescription: string | null;
  gender: string | null;
  alignment: string | null;
  personality: string | null;
  race: string | null;
  class: string | null;
  level: number | null;
  isPC: boolean;
  age: string | null;
  voice: string | null;
  mannerisms: string | null;
  goals: string | null;
  secrets: string | null;
  abilities: string | null;
}

export interface CreatureDetail {
  id: string;
  nodeId: string;
  species: string | null;
  size: string | null;
  challengeRating: string | null;
  habitat: string | null;
  stats: Record<string, unknown>;
  abilities: string | null;
}

export interface ItemDetail {
  id: string;
  nodeId: string;
  weight: string | null;
  value: string | null;
  rarity: string | null;
  itemType: string | null;
  requiresAttunement: boolean;
  abilities: string | null;
}

export interface LocationDetail {
  id: string;
  nodeId: string;
  region: string | null;
  climate: string | null;
  population: string | null;
  locationType: LocationType;
}

export interface Node {
  id: string;
  type: NodeType;
  title: string;
  excerpt: string | null;
  ownerId: string;
  campaignId: string | null;
  visibility: Visibility;
  parentId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; displayName: string };
  campaign?: { id: string; name: string; dmId: string };
  parent?: { id: string; title: string; type: NodeType } | null;
  children?: { id: string; title: string; type: NodeType }[];
  tags: NodeTag[];
  arcDetail?: ArcDetail | null;
  sessionDetail?: SessionDetail | null;
  characterDetail?: CharacterDetail | null;
  creatureDetail?: CreatureDetail | null;
  itemDetail?: ItemDetail | null;
  locationDetail?: LocationDetail | null;
  outgoingLinks?: NodeLink[];
  incomingLinks?: NodeLink[];
  blocks?: NodeBlock[];
  _count?: { blocks: number };
}

// ─── Blocks ───────────────────────────────────────────

export interface NodeBlock {
  id: string;
  nodeId: string;
  authorId: string;
  type: BlockType;
  content: Record<string, unknown>;
  ordering: number;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
  author: { id: string; displayName: string };
}
