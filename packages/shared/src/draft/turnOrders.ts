import type { DraftConfig, Team, TurnStep } from "../types.js";
import { resolveMapRoles } from "./mapRoles.js";

/**
 * Generates the full turn order for a draft as a flat array of steps.
 * The draft machine walks through this array sequentially.
 *
 * Map drafts:       MAP_BAN → COMPLETE
 * Character drafts: CHAR_BAN → CHAR_PICK → COMPLETE
 */
export function generateTurnOrder(config: DraftConfig): TurnStep[] {
  const steps: TurnStep[] = [];

  if (config.draftType === "map") {
    // ── Map Ban Phase only ──
    if (config.mapBanMode === "bo3") {
      const { sideSelect, mapSelect } = resolveMapRoles(config);
      // S ban, M ban, S pick [game 2], M pick [game 1], S ban, M ban
      steps.push({ phase: "MAP_BAN", team: sideSelect, type: "map_ban", index: 0 });
      steps.push({ phase: "MAP_BAN", team: mapSelect, type: "map_ban", index: 0 });
      steps.push({ phase: "MAP_BAN", team: sideSelect, type: "map_pick", index: 0 });
      steps.push({ phase: "MAP_BAN", team: mapSelect, type: "map_pick", index: 1 });
      steps.push({ phase: "MAP_BAN", team: sideSelect, type: "map_ban", index: 1 });
      steps.push({ phase: "MAP_BAN", team: mapSelect, type: "map_ban", index: 1 });
    } else {
      // Bo1: S bans 3 maps, then M picks 1
      const { sideSelect, mapSelect } = resolveMapRoles(config);
      steps.push({ phase: "MAP_BAN", team: sideSelect, type: "map_ban", index: 0 });
      steps.push({ phase: "MAP_BAN", team: sideSelect, type: "map_ban", index: 1 });
      steps.push({ phase: "MAP_BAN", team: sideSelect, type: "map_ban", index: 2 });
      steps.push({ phase: "MAP_BAN", team: mapSelect, type: "map_pick", index: 0 });
    }
  } else {
    // ── Character Ban Phase ──
    if (config.banMode !== "none") {
      const banSteps = generateBanSteps(config.banMode, config.numBans);
      steps.push(...banSteps);
    }

    // ── Character Pick Phase ──
    const pickSteps = generatePickSteps(config.draftMode, config.numPicks);
    steps.push(...pickSteps);
  }

  return steps;
}

function generateBanSteps(
  banMode: DraftConfig["banMode"],
  numBans: number,
): TurnStep[] {
  const steps: TurnStep[] = [];

  if (banMode === "staggered") {
    // Alternating: B, R, B, R, ...
    for (let i = 0; i < numBans * 2; i++) {
      const team: Team = i % 2 === 0 ? "blue" : "red";
      steps.push({
        phase: "CHAR_BAN",
        team,
        type: "ban",
        index: Math.floor(i / 2),
      });
    }
  } else if (banMode === "simultaneous") {
    // Both teams ban at the same time
    for (let i = 0; i < numBans; i++) {
      steps.push({
        phase: "CHAR_BAN",
        team: "both",
        type: "ban",
        index: i,
      });
    }
  }

  return steps;
}

function generatePickSteps(
  draftMode: DraftConfig["draftMode"],
  numPicks: number,
): TurnStep[] {
  const steps: TurnStep[] = [];

  if (draftMode === "alternating") {
    // B, R, B, R, B, R
    for (let i = 0; i < numPicks * 2; i++) {
      const team: Team = i % 2 === 0 ? "blue" : "red";
      steps.push({
        phase: "CHAR_PICK",
        team,
        type: "pick",
        index: Math.floor(i / 2),
      });
    }
  } else if (draftMode === "snake") {
    // B, R, R, B, B, R (snake draft)
    const order = generateSnakeOrder(numPicks);
    for (let i = 0; i < order.length; i++) {
      const team = order[i]!;
      // Count how many picks this team has had so far
      const teamIndex = order.slice(0, i).filter((t) => t === team).length;
      steps.push({
        phase: "CHAR_PICK",
        team,
        type: "pick",
        index: teamIndex,
      });
    }
  } else if (draftMode === "simultaneous") {
    // Both teams pick at the same time
    for (let i = 0; i < numPicks; i++) {
      steps.push({
        phase: "CHAR_PICK",
        team: "both",
        type: "pick",
        index: i,
      });
    }
  }

  return steps;
}

/**
 * Generates snake draft order: B, R, R, B, B, R, R, B, ...
 * Blue gets first pick, then direction reverses each round.
 */
function generateSnakeOrder(numPicks: number): Team[] {
  const order: Team[] = [];
  let direction: Team[] = ["blue", "red"];

  for (let round = 0; round < numPicks; round++) {
    order.push(...direction);
    direction = [...direction].reverse();
  }

  return order;
}
