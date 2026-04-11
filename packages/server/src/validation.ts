import type { DraftConfig } from "@os-drafter/shared";
import { MAPS, CURRENT_AWAKENING_POOL, AWAKENING_EXCLUSIONS } from "@os-drafter/shared";

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
    if (!Array.isArray(c.excludedMaps)) {
      return "excludedMaps must be an array of map IDs";
    }
    if (new Set(c.excludedMaps as string[]).size !== (c.excludedMaps as string[]).length) {
      return "excludedMaps must contain distinct map IDs";
    }
    const activeMapCount = MAPS.filter(m => m.active).length;
    const poolSize = activeMapCount - (c.excludedMaps as string[]).length;
    const minPool = (c.mapBanMode as string) === "bo3" ? 7 : 4;
    if (poolSize < minPool) {
      return `Map pool too small: need at least ${minPool} maps for ${c.mapBanMode as string}`;
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

    // Validate optional awakening fields
    if (c.chosenAwakenings !== undefined && c.excludedAwakenings !== undefined) {
      return "Cannot specify both chosenAwakenings and excludedAwakenings";
    }

    if (c.chosenAwakenings !== undefined) {
      if (!Array.isArray(c.chosenAwakenings) || c.chosenAwakenings.length !== 2) {
        return "chosenAwakenings must be a pair of 2 awakening IDs";
      }
      const [a, b] = c.chosenAwakenings as [string, string];
      if (a === b) {
        return "chosenAwakenings must contain 2 distinct IDs";
      }
      const poolSet = new Set(CURRENT_AWAKENING_POOL);
      if (!poolSet.has(a) || !poolSet.has(b)) {
        return "chosenAwakenings must reference valid awakening pool IDs";
      }
      const exclusions = AWAKENING_EXCLUSIONS[a] ?? [];
      if (exclusions.includes(b)) {
        return "Chosen awakenings violate exclusion rules";
      }
    }

    if (c.excludedAwakenings !== undefined) {
      if (!Array.isArray(c.excludedAwakenings)) {
        return "excludedAwakenings must be an array";
      }
      const poolSet = new Set(CURRENT_AWAKENING_POOL);
      for (const id of c.excludedAwakenings as string[]) {
        if (typeof id !== "string" || !poolSet.has(id)) {
          return `Invalid excluded awakening ID: ${id}`;
        }
      }
      const remaining = CURRENT_AWAKENING_POOL.filter(
        id => !(c.excludedAwakenings as string[]).includes(id)
      );
      if (remaining.length < 2) {
        return "Too many awakenings excluded: at least 2 must remain in the pool";
      }
    }
  }

  // Validate optional team names (normalization is done by normalizeTeamName)
  for (const field of ["blueTeamName", "redTeamName"] as const) {
    if (c[field] !== undefined) {
      if (typeof c[field] !== "string") {
        return `${field} must be a string of at most 4 characters`;
      }
      const trimmed = (c[field] as string).trim();
      if (trimmed.length > 4) {
        return `${field} must be at most 4 characters`;
      }
    }
  }

  return null;
}

/**
 * Normalize a team name: trim, uppercase, and return undefined for blank.
 */
export function normalizeTeamName(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const trimmed = name.trim().toUpperCase();
  return trimmed.length > 0 ? trimmed : undefined;
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
    blueTeamName: { type: "string" as const, maxLength: 4 },
    redTeamName: { type: "string" as const, maxLength: 4 },
    excludedAwakenings: {
      type: "array" as const,
      items: { type: "string" as const },
    },
    chosenAwakenings: {
      type: "array" as const,
      items: { type: "string" as const },
      minItems: 2,
      maxItems: 2,
    },
  },
};
