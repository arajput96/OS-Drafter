"use client";

import { MAPS } from "@os-drafter/shared";
import type { DraftState, RoomState, Team, TurnStep } from "@os-drafter/shared";
import { OverlayMapCard } from "./overlay-map-card";

interface MapDraftOverlayProps {
  draft: DraftState;
  room: RoomState;
}

const mapLookup = new Map(MAPS.map((m) => [m.id, m]));

interface MapSlot {
  map: ReturnType<typeof mapLookup.get> | null;
  status: "empty" | "banned" | "picked";
  team?: Team;
  teamName?: string;
}

/**
 * For a ban step, resolve the map from the team's ban array.
 * Uses step.index which maps directly to the ban array index.
 */
function getBanForStep(
  step: TurnStep,
  draft: DraftState,
): { mapId: string | null; acted: boolean; team: Team } {
  const team: Team = step.team === "both" ? "blue" : step.team;
  const bans = team === "blue" ? draft.mapBans.blueBans : draft.mapBans.redBans;
  const acted = bans.length > step.index;
  return { mapId: acted ? bans[step.index]! : null, acted, team };
}

/**
 * For a picked map, determine which team picked it.
 */
function getPickTeam(mapId: string, draft: DraftState): Team | undefined {
  if (draft.mapBans.bluePicks.includes(mapId)) return "blue";
  if (draft.mapBans.redPicks.includes(mapId)) return "red";
  return undefined;
}

export function MapDraftOverlay({ draft, room }: MapDraftOverlayProps) {
  const blueName = room.blueTeamName || "BLUE";
  const redName = room.redTeamName || "RED";
  const isBo3 = draft.config.mapBanMode === "bo3";

  const banSteps = draft.turnOrder.filter((s) => s.type === "map_ban");
  const slots: MapSlot[] = [];

  const nameFor = (team?: Team) =>
    team === "blue" ? blueName : team === "red" ? redName : undefined;

  if (isBo3) {
    // BO3 layout: Ban, Ban, Game 1, Game 2, Ban, Ban, Game 3 (decider)
    // First 2 bans
    for (let i = 0; i < 2 && i < banSteps.length; i++) {
      const { mapId, acted, team } = getBanForStep(banSteps[i]!, draft);
      const map = mapId ? mapLookup.get(mapId) ?? null : null;
      slots.push({
        map: acted ? map : null,
        status: acted ? "banned" : "empty",
        team: acted ? team : undefined,
        teamName: acted ? nameFor(team) : undefined,
      });
    }

    // Game 1 (gameOrder[0]) and Game 2 (gameOrder[1])
    for (let g = 0; g < 2; g++) {
      const mapId = draft.mapBans.gameOrder[g];
      if (mapId) {
        const map = mapLookup.get(mapId) ?? null;
        const team = getPickTeam(mapId, draft);
        slots.push({
          map,
          status: "picked",
          team,
          teamName: nameFor(team),
        });
      } else {
        slots.push({ map: null, status: "empty" });
      }
    }

    // Last 2 bans
    for (let i = 2; i < 4 && i < banSteps.length; i++) {
      const { mapId, acted, team } = getBanForStep(banSteps[i]!, draft);
      const map = mapId ? mapLookup.get(mapId) ?? null : null;
      slots.push({
        map: acted ? map : null,
        status: acted ? "banned" : "empty",
        team: acted ? team : undefined,
        teamName: acted ? nameFor(team) : undefined,
      });
    }

    // Game 3 / Decider (gameOrder[2] or remaining map)
    const game3Id = draft.mapBans.gameOrder[2];
    if (game3Id) {
      const map = mapLookup.get(game3Id) ?? null;
      slots.push({ map, status: "picked" });
    } else {
      slots.push({ map: null, status: "empty" });
    }
  } else {
    // BO1 layout: Ban, Ban, Ban, Pick (all sequential from turn order)
    for (const step of draft.turnOrder) {
      if (step.type === "map_ban") {
        const { mapId, acted, team } = getBanForStep(step, draft);
        const map = mapId ? mapLookup.get(mapId) ?? null : null;
        slots.push({
          map: acted ? map : null,
          status: acted ? "banned" : "empty",
          team: acted ? team : undefined,
          teamName: acted ? nameFor(team) : undefined,
        });
      } else if (step.type === "map_pick") {
        const team: Team = step.team === "both" ? "blue" : step.team;
        const picks = team === "blue" ? draft.mapBans.bluePicks : draft.mapBans.redPicks;
        const acted = picks.length > 0;
        const mapId = acted ? picks[0]! : null;
        const map = mapId ? mapLookup.get(mapId) ?? null : null;
        slots.push({
          map: acted ? map : null,
          status: acted ? "picked" : "empty",
          team: acted ? team : undefined,
          teamName: acted ? nameFor(team) : undefined,
        });
      }
    }
  }

  return (
    <div className="flex items-end gap-3">
      {slots.map((slot, i) => (
        <OverlayMapCard
          key={i}
          map={slot.map ?? null}
          status={slot.status}
          team={slot.team}
          teamName={slot.teamName}
        />
      ))}
    </div>
  );
}
