import type { DraftState, RoomState } from "@os-drafter/shared";
import { MAPS } from "@os-drafter/shared";
import { TeamPanel } from "./team-panel";
import { AwakeningDisplay } from "./awakening-display";

const mapMap = new Map(MAPS.map((m) => [m.id, m]));

interface DraftCompleteProps {
  draft: DraftState;
  room: RoomState;
}

export function DraftComplete({ draft, room }: DraftCompleteProps) {
  const isMapDraft = draft.config.draftType === "map";

  if (isMapDraft) {
    return <MapDraftComplete draft={draft} />;
  }

  return <CharacterDraftComplete draft={draft} room={room} />;
}

function MapDraftComplete({ draft }: { draft: DraftState }) {
  const isBo3 = draft.config.mapBanMode === "bo3";
  const selectedMap = draft.mapBans.selectedMap
    ? mapMap.get(draft.mapBans.selectedMap) ?? null
    : null;

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-2xl font-bold text-primary">Map Draft Complete</h2>

      {isBo3 ? (
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {draft.mapBans.gameOrder.map((mapId, i) => {
            const map = mapId ? mapMap.get(mapId) ?? null : null;
            return (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-4 py-3">
                <span className="text-sm font-medium text-muted-foreground">Game {i + 1}</span>
                <span className="text-sm font-semibold">{map?.name ?? "—"}</span>
              </div>
            );
          })}
        </div>
      ) : (
        selectedMap && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Selected Map</p>
            <p className="text-lg font-semibold">{selectedMap.name}</p>
          </div>
        )
      )}
    </div>
  );
}

function CharacterDraftComplete({ draft, room }: { draft: DraftState; room: RoomState }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-2xl font-bold text-primary">Draft Complete</h2>

      {draft.config.selectedMapName && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Map</p>
          <p className="text-lg font-semibold">{draft.config.selectedMapName}</p>
        </div>
      )}

      {room.revealedAwakenings && (
        <AwakeningDisplay awakeningIds={room.revealedAwakenings} />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:gap-8 w-full max-w-xl">
        <div className="flex-1">
          <TeamPanel team="blue" draft={draft} />
        </div>
        <div className="flex-1">
          <TeamPanel team="red" draft={draft} />
        </div>
      </div>
    </div>
  );
}
