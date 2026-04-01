import type { DraftState } from "@os-drafter/shared";
import { MAPS } from "@os-drafter/shared";
import { TeamPanel } from "./team-panel";

const mapMap = new Map(MAPS.map((m) => [m.id, m]));

interface DraftCompleteProps {
  draft: DraftState;
}

export function DraftComplete({ draft }: DraftCompleteProps) {
  const selectedMapId = draft.mapBans.selectedMap;
  const selectedMap = selectedMapId ? mapMap.get(selectedMapId) ?? null : null;

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-2xl font-bold text-primary">Draft Complete</h2>

      {selectedMap && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Map</p>
          <p className="text-lg font-semibold">{selectedMap.name}</p>
        </div>
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
