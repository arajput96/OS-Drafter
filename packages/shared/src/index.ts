export type Team = "blue" | "red";

export type DraftPhase =
  | "WAITING"
  | "MAP_BAN"
  | "AWAKENING_REVEAL"
  | "CHAR_BAN"
  | "CHAR_PICK"
  | "COMPLETE";

export interface DraftConfig {
  draftMode: "snake" | "alternating" | "simultaneous";
  banMode: "simultaneous" | "staggered" | "none";
  mirrorRule: "no_mirrors" | "team_mirrors" | "full_duplicates";
  timerSeconds: number;
  numBans: number;
}

export const APP_NAME = "Omega Strikers Drafter";
export const SERVER_PORT = 8082;
export const CLIENT_PORT = 3000;
