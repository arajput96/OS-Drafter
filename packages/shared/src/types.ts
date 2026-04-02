// ── Game Data Types ──

export interface Character {
  id: string;
  name: string;
  icon: string;
}

export interface GameMap {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  description: string;
}

export interface Awakening {
  id: string;
  name: string;
  icon: string;
}

// ── Draft Types ──

export type Team = "blue" | "red";

export type DraftPhase =
  | "WAITING"
  | "MAP_BAN"
  | "AWAKENING_REVEAL"
  | "CHAR_BAN"
  | "CHAR_PICK"
  | "COMPLETE";

export type DraftMode = "snake" | "alternating" | "simultaneous";
export type BanMode = "simultaneous" | "staggered" | "none";
export type MirrorRule = "no_mirrors" | "team_mirrors" | "full_duplicates";
export type MapBanMode = "bo1" | "bo3";
export type MapRole = "side_select" | "map_select";

export interface DraftConfig {
  draftMode: DraftMode;
  banMode: BanMode;
  mirrorRule: MirrorRule;
  timerSeconds: number;
  numBans: number;
  numPicks: number;
  mapBanMode: MapBanMode;
  blueMapRole: MapRole;
  excludedMaps: string[];
}

export type DraftAction =
  | {
      type: "map_ban";
      team: Team;
      mapId: string;
      index: number;
    }
  | {
      type: "map_pick";
      team: Team;
      mapId: string;
      index: number;
    }
  | {
      type: "awakening_pick";
      team: Team;
      awakeningId: string;
      index: number;
    }
  | {
      type: "ban" | "pick";
      team: Team;
      characterId: string;
      index: number;
    };

export interface DraftSlot {
  team: Team;
  type: "ban" | "pick";
  characterId: string | null;
  locked: boolean;
}

export interface MapBanState {
  mapPool: string[];
  blueBans: string[];
  redBans: string[];
  bluePicks: string[];
  redPicks: string[];
  selectedMap: string | null;
  gameOrder: [string | null, string | null, string | null];
}

export interface AwakeningRevealState {
  revealedPair: [string, string] | null;
  blueChoice: string | null;
  redChoice: string | null;
}

export interface TurnStep {
  phase: DraftPhase;
  team: Team | "both";
  type: "map_ban" | "map_pick" | "awakening_pick" | "ban" | "pick";
  index: number;
}

export interface DraftState {
  phase: DraftPhase;
  config: DraftConfig;
  mapBans: MapBanState;
  awakeningReveal: AwakeningRevealState;
  blueTeamBans: (string | null)[];
  redTeamBans: (string | null)[];
  blueTeamPicks: (string | null)[];
  redTeamPicks: (string | null)[];
  currentTurn: Team | "both";
  timerRemaining: number;
  turnOrder: TurnStep[];
  turnIndex: number;
  pendingActions: {
    blue: string | null;
    red: string | null;
  } | null;
}

export type DraftResult =
  | { ok: true; state: Readonly<DraftState> }
  | { ok: false; error: string };

// ── Room Types ──

export type RoomRole = "blue" | "red" | "spectator";

export interface RoomState {
  roomId: string;
  config: DraftConfig;
  blueConnected: boolean;
  redConnected: boolean;
  spectatorCount: number;
  draft: DraftState | null;
}

// ── Socket.IO Event Types ──

export interface ClientToServerEvents {
  "room:create": (
    config: DraftConfig,
    callback: (roomId: string) => void,
  ) => void;
  "room:join": (roomId: string, role: RoomRole) => void;
  "draft:start": () => void;
  "draft:ban-map": (mapId: string) => void;
  "draft:pick-map": (mapId: string) => void;
  "draft:pick-awakening": (awakeningId: string) => void;
  "draft:select": (characterId: string) => void;
  "draft:lock": () => void;
}

export interface ServerToClientEvents {
  "room:state": (state: RoomState) => void;
  "draft:state": (state: DraftState) => void;
  "draft:timer": (remaining: number) => void;
  "draft:phase-change": (phase: DraftPhase) => void;
  "draft:action": (action: DraftAction) => void;
  error: (message: string) => void;
}
