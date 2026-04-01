"use client";

import { MAPS } from "@os-drafter/shared";
import type { DraftState, Team } from "@os-drafter/shared";
import { MapCard, type MapCardState } from "./map-card";

interface MapBanPhaseProps {
  draft: DraftState;
  myTeam: Team | null;
  onBanMap?: (mapId: string) => void;
}

export function MapBanPhase({ draft, myTeam, onBanMap }: MapBanPhaseProps) {
  const bannedMaps = new Set([
    ...draft.mapBans.blueBans,
    ...draft.mapBans.redBans,
  ]);

  const isMyTurn =
    draft.currentTurn === "both" || draft.currentTurn === myTeam;
  const canBan = isMyTurn && draft.phase === "MAP_BAN" && myTeam !== null;

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground">
        {canBan
          ? "Select a map to ban"
          : myTeam
            ? "Waiting for opponent..."
            : "Map ban in progress"}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {MAPS.filter((m) => m.active).map((map) => {
          const state: MapCardState = bannedMaps.has(map.id)
            ? "banned"
            : "available";
          return (
            <MapCard
              key={map.id}
              map={map}
              state={state}
              onClick={
                canBan && state === "available"
                  ? () => onBanMap?.(map.id)
                  : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}
