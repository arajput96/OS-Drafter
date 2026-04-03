import type { DraftConfig } from "@os-drafter/shared";

const VALID_DRAFT_TYPES = ["map", "character"];
const VALID_DRAFT_MODES = ["snake", "alternating", "simultaneous"];
const VALID_BAN_MODES = ["simultaneous", "staggered", "none"];
const VALID_MIRROR_RULES = ["no_mirrors", "team_mirrors", "full_duplicates"];
const VALID_MAP_BAN_MODES = ["bo1", "bo3"];
const VALID_MAP_ROLES = ["side_select", "map_select"];

/**
 * Validates a DraftConfig object. Returns null if valid, or an error string.
 */
export function validateDraftConfig(config: unknown): string | null {
  if (!config || typeof config !== "object") {
    return "Invalid draft configuration";
  }

  const c = config as Record<string, unknown>;

  if (!VALID_DRAFT_TYPES.includes(c.draftType as string)) {
    return `Invalid draftType: must be one of ${VALID_DRAFT_TYPES.join(", ")}`;
  }

  if (typeof c.timerSeconds !== "number" || c.timerSeconds < 1) {
    return "timerSeconds must be a positive integer";
  }

  if (c.draftType === "map") {
    if (!VALID_MAP_BAN_MODES.includes(c.mapBanMode as string)) {
      return `Invalid mapBanMode: must be one of ${VALID_MAP_BAN_MODES.join(", ")}`;
    }
    if (!VALID_MAP_ROLES.includes(c.blueMapRole as string)) {
      return `Invalid blueMapRole: must be one of ${VALID_MAP_ROLES.join(", ")}`;
    }
    if (!Array.isArray(c.excludedMaps) || c.excludedMaps.length !== 3) {
      return "excludedMaps must be an array of exactly 3 map IDs";
    }
    if (new Set(c.excludedMaps).size !== 3) {
      return "excludedMaps must contain 3 distinct map IDs";
    }
  } else {
    // character draft
    if (!VALID_DRAFT_MODES.includes(c.draftMode as string)) {
      return `Invalid draftMode: must be one of ${VALID_DRAFT_MODES.join(", ")}`;
    }
    if (!VALID_BAN_MODES.includes(c.banMode as string)) {
      return `Invalid banMode: must be one of ${VALID_BAN_MODES.join(", ")}`;
    }
    if (!VALID_MIRROR_RULES.includes(c.mirrorRule as string)) {
      return `Invalid mirrorRule: must be one of ${VALID_MIRROR_RULES.join(", ")}`;
    }
    if (typeof c.numBans !== "number" || c.numBans < 0) {
      return "numBans must be a non-negative integer";
    }
    if (typeof c.numPicks !== "number" || c.numPicks < 1) {
      return "numPicks must be a positive integer";
    }
  }

  return null;
}

/** Fastify JSON schema for DraftConfig body validation */
export const draftConfigSchema = {
  type: "object" as const,
  required: ["draftType", "timerSeconds"],
  properties: {
    draftType: { type: "string" as const, enum: VALID_DRAFT_TYPES },
    draftMode: { type: "string" as const, enum: VALID_DRAFT_MODES },
    banMode: { type: "string" as const, enum: VALID_BAN_MODES },
    mirrorRule: { type: "string" as const, enum: VALID_MIRROR_RULES },
    timerSeconds: { type: "integer" as const, minimum: 1 },
    numBans: { type: "integer" as const, minimum: 0 },
    numPicks: { type: "integer" as const, minimum: 1 },
    mapBanMode: { type: "string" as const, enum: VALID_MAP_BAN_MODES },
    blueMapRole: { type: "string" as const, enum: VALID_MAP_ROLES },
    excludedMaps: {
      type: "array" as const,
      items: { type: "string" as const },
    },
    selectedMapName: { type: "string" as const },
  },
};
