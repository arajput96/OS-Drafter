import type { DraftConfig } from "@os-drafter/shared";

const VALID_DRAFT_MODES = ["snake", "alternating", "simultaneous"];
const VALID_BAN_MODES = ["simultaneous", "staggered", "none"];
const VALID_MIRROR_RULES = ["no_mirrors", "team_mirrors", "full_duplicates"];

/**
 * Validates a DraftConfig object. Returns null if valid, or an error string.
 */
export function validateDraftConfig(config: unknown): string | null {
  if (!config || typeof config !== "object") {
    return "Invalid draft configuration";
  }

  const c = config as Record<string, unknown>;

  if (!VALID_DRAFT_MODES.includes(c.draftMode as string)) {
    return `Invalid draftMode: must be one of ${VALID_DRAFT_MODES.join(", ")}`;
  }
  if (!VALID_BAN_MODES.includes(c.banMode as string)) {
    return `Invalid banMode: must be one of ${VALID_BAN_MODES.join(", ")}`;
  }
  if (!VALID_MIRROR_RULES.includes(c.mirrorRule as string)) {
    return `Invalid mirrorRule: must be one of ${VALID_MIRROR_RULES.join(", ")}`;
  }
  if (typeof c.timerSeconds !== "number" || c.timerSeconds < 1) {
    return "timerSeconds must be a positive integer";
  }
  if (typeof c.numBans !== "number" || c.numBans < 0) {
    return "numBans must be a non-negative integer";
  }
  if (typeof c.numPicks !== "number" || c.numPicks < 1) {
    return "numPicks must be a positive integer";
  }
  if (typeof c.numMapBans !== "number" || c.numMapBans < 0) {
    return "numMapBans must be a non-negative integer";
  }

  return null;
}

/** Fastify JSON schema for DraftConfig body validation */
export const draftConfigSchema = {
  type: "object" as const,
  required: [
    "draftMode",
    "banMode",
    "mirrorRule",
    "timerSeconds",
    "numBans",
    "numPicks",
    "numMapBans",
  ],
  properties: {
    draftMode: { type: "string" as const, enum: VALID_DRAFT_MODES },
    banMode: { type: "string" as const, enum: VALID_BAN_MODES },
    mirrorRule: { type: "string" as const, enum: VALID_MIRROR_RULES },
    timerSeconds: { type: "integer" as const, minimum: 1 },
    numBans: { type: "integer" as const, minimum: 0 },
    numPicks: { type: "integer" as const, minimum: 1 },
    numMapBans: { type: "integer" as const, minimum: 0 },
  },
  additionalProperties: false,
};
