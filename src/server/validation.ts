const VALID_DRAFT_TYPES = ["map", "character"];
const VALID_DRAFT_MODES = ["snake", "alternating", "simultaneous"];
const VALID_BAN_MODES = ["simultaneous", "staggered", "none"];
const VALID_MIRROR_RULES = ["no_mirrors", "team_mirrors", "full_duplicates"];
const VALID_MAP_BAN_MODES = ["bo1", "bo3"];
const VALID_MAP_ROLES = ["side_select", "map_select"];

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

export function normalizeTeamName(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const trimmed = name.trim().toUpperCase();
  return trimmed.length > 0 ? trimmed : undefined;
}
