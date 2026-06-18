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
export type NodeType =
  | "SESSION"
  | "CHARACTER"
  | "CREATURE"
  | "ITEM"
  | "LOCATION"
  | "NOTE"
  | "FACTION";
export type BlockType = "TEXT" | "RICH_TEXT" | "IMAGE";
export type LocationType =
  | "REGION"
  | "CITY"
  | "TOWN"
  | "DUNGEON"
  | "BUILDING"
  | "WILDERNESS"
  | "POINT_OF_INTEREST";

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

export interface CalendarDate {
  ageId: string;
  year: number;
  monthId: string;
  day: number;
}

export interface CalendarAge {
  id: string;
  calendarId: string;
  name: string;
  startYear: number;
  endYear: number | null;
  order: number;
}

export interface CalendarMonth {
  id: string;
  calendarId: string;
  name: string;
  days: number;
  order: number;
}

export interface CalendarMoon {
  id: string;
  calendarId: string;
  name: string;
  cycleLength: number;
  anchorAgeId: string | null;
  anchorMonthId: string | null;
  anchorDay: number | null;
  order: number;
}

export interface CampaignCalendar {
  id: string;
  campaignId: string;
  name: string;
  daysInWeek: number;
  weekdayNames: string[];
  anchorAgeId: string | null;
  anchorMonthId: string | null;
  anchorDay: number | null;
  anchorWeekdayIndex: number;
  ages: CalendarAge[];
  months: CalendarMonth[];
  moons: CalendarMoon[];
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
  startDateAgeId: string | null;
  startDateYear: number | null;
  startDateMonthId: string | null;
  startDateDay: number | null;
  endDateAgeId: string | null;
  endDateYear: number | null;
  endDateMonthId: string | null;
  endDateDay: number | null;
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

export interface FactionDetail {
  id: string;
  nodeId: string;
  factionType: string | null;
  description: string | null;
  alignment: string | null;
  size: string | null;
  reach: string | null;
  goals: string | null;
  secrets: string | null;
  resources: string | null;
  publicImage: string | null;
  leaderName: string | null;
  headquarters: string | null;
  influenceLevel: string | null;
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
  ancestors?: { id: string; title: string; type: NodeType }[];
  children?: { id: string; title: string; type: NodeType }[];
  tags: NodeTag[];
  sessionDetail?: SessionDetail | null;
  characterDetail?: CharacterDetail | null;
  creatureDetail?: CreatureDetail | null;
  itemDetail?: ItemDetail | null;
  locationDetail?: LocationDetail | null;
  factionDetail?: FactionDetail | null;
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

// ─── Search ───────────────────────────────────────────

export interface SearchSuggestion {
  id: string;
  title: string;
  type: NodeType;
  campaignId: string;
  campaignName: string;
}

export interface SearchResult {
  id: string;
  title: string;
  excerpt: string | null;
  type: NodeType;
  campaignId: string;
  campaignName: string;
  ownerId: string;
  visibility: Visibility;
  updatedAt: string;
  score: number;
  matchedFields: string[];
}

export interface SearchResultsResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
