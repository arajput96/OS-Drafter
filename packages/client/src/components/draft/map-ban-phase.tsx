"use client";

import { MAPS } from "@os-drafter/shared";
import type { DraftState, Team } from "@os-drafter/shared";
import { MapCard, type MapCardState } from "./map-card";

interface MapBanPhaseProps {
  draft: DraftState;
  myTeam: Team | null;
  isComplete?: boolean;
  onBanMap?: (mapId: string) => void;
  onPickMap?: (mapId: string) => void;
}

export function MapBanPhase({ draft, myTeam, isComplete, onBanMap, onPickMap }: MapBanPhaseProps) {
  const bannedMaps = new Set([
    ...draft.mapBans.blueBans,
    ...draft.mapBans.redBans,
  ]);
  const bluePickedMaps = new Set(draft.mapBans.bluePicks);
  const redPickedMaps = new Set(draft.mapBans.redPicks);

  const currentStep = draft.turnOrder[draft.turnIndex];
  const isMapPick = currentStep?.type === "map_pick";

  const isMyTurn =
    draft.currentTurn === "both" || draft.currentTurn === myTeam;
  const canAct = isMyTurn && draft.phase === "MAP_BAN" && myTeam !== null;

  const isBo3 = draft.config.mapBanMode === "bo3";

  // Build game label map for picked maps
  const gameLabelMap = new Map<string, string>();
  if (isBo3) {
    const [g1, g2, g3] = draft.mapBans.gameOrder;
    if (g1) gameLabelMap.set(g1, "Game 1");
    if (g2) gameLabelMap.set(g2, "Game 2");
    if (g3) gameLabelMap.set(g3, "Game 3");
  }

  // Filter to only maps in the pool (excludes excluded maps)
  const poolSet = new Set(draft.mapBans.mapPool);

  const promptText = isComplete
    ? null
    : canAct
      ? isMapPick
        ? "Select a map to pick"
        : "Select a map to ban"
      : myTeam
        ? "Waiting for opponent..."
        : "Map phase in progress";

  const handleClick = (mapId: string) => {
    if (isMapPick) {
      onPickMap?.(mapId);
    } else {
      onBanMap?.(mapId);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {promptText && <p className="text-sm text-muted-foreground">{promptText}</p>}

      {/* Bo3 Game Order Display */}
      {isBo3 && (
        <div className="flex gap-4 text-xs">
          {(["Game 1", "Game 2", "Game 3"] as const).map((label, i) => {
            const mapId = draft.mapBans.gameOrder[i];
            const mapName = mapId
              ? MAPS.find((m) => m.id === mapId)?.name ?? mapId
              : "---";
            return (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className="font-medium text-muted-foreground">{label}</span>
                <span className="text-foreground">{mapName}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {MAPS.filter((m) => m.active && poolSet.has(m.id)).map((map) => {
          let state: MapCardState;
          if (bannedMaps.has(map.id)) {
            state = "banned";
          } else if (bluePickedMaps.has(map.id)) {
            state = "picked_blue";
          } else if (redPickedMaps.has(map.id)) {
            state = "picked_red";
          } else {
            state = "available";
          }

          return (
            <MapCard
              key={map.id}
              map={map}
              state={state}
              gameLabel={gameLabelMap.get(map.id)}
              onClick={
                canAct && state === "available"
                  ? () => handleClick(map.id)
                  : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}
