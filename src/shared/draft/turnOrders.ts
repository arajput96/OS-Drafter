import type { DraftConfig, Team, TurnStep } from "../types";
import { resolveMapRoles } from "./mapRoles";

export function generateTurnOrder(config: DraftConfig): TurnStep[] {
  const steps: TurnStep[] = [];

  if (config.draftType === "map") {
    if (config.mapBanMode === "bo3") {
      const { sideSelect, mapSelect } = resolveMapRoles(config);
      steps.push({ phase: "MAP_BAN", team: sideSelect, type: "map_ban", index: 0 });
      steps.push({ phase: "MAP_BAN", team: mapSelect, type: "map_ban", index: 0 });
      steps.push({ phase: "MAP_BAN", team: sideSelect, type: "map_pick", index: 0 });
      steps.push({ phase: "MAP_BAN", team: mapSelect, type: "map_pick", index: 1 });
      steps.push({ phase: "MAP_BAN", team: sideSelect, type: "map_ban", index: 1 });
      steps.push({ phase: "MAP_BAN", team: mapSelect, type: "map_ban", index: 1 });
    } else {
      const { sideSelect, mapSelect } = resolveMapRoles(config);
      steps.push({ phase: "MAP_BAN", team: sideSelect, type: "map_ban", index: 0 });
      steps.push({ phase: "MAP_BAN", team: sideSelect, type: "map_ban", index: 1 });
      steps.push({ phase: "MAP_BAN", team: sideSelect, type: "map_ban", index: 2 });
      steps.push({ phase: "MAP_BAN", team: mapSelect, type: "map_pick", index: 0 });
    }
  } else {
    if (config.banMode !== "none") {
      const banSteps = generateBanSteps(config.banMode, config.numBans);
      steps.push(...banSteps);
    }

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
    const order = generateSnakeOrder(numPicks);
    for (let i = 0; i < order.length; i++) {
      const team = order[i]!;
      const teamIndex = order.slice(0, i).filter((t) => t === team).length;
      steps.push({
        phase: "CHAR_PICK",
        team,
        type: "pick",
        index: teamIndex,
      });
    }
  } else if (draftMode === "simultaneous") {
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

function generateSnakeOrder(numPicks: number): Team[] {
  const order: Team[] = [];
  let direction: Team[] = ["blue", "red"];

  for (let round = 0; round < numPicks; round++) {
    order.push(...direction);
    direction = [...direction].reverse();
  }

  return order;
}
