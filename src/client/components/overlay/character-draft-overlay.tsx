import { MAPS, AWAKENINGS } from "@shared/index";
import type { DraftState, RoomState, Team, TurnStep } from "@shared/types";
import { OverlayPortrait } from "./overlay-portrait";

interface CharacterDraftOverlayProps {
  draft: DraftState;
  room: RoomState;
}

const mapLookup = new Map(MAPS.map((m) => [m.name, m]));
const awakeningMap = new Map(AWAKENINGS.map((a) => [a.id, a]));

interface PhaseGroup {
  label: string;
  steps: TurnStep[];
}

function groupTurnSteps(turnOrder: TurnStep[]): PhaseGroup[] {
  const groups: PhaseGroup[] = [];

  const banSteps = turnOrder.filter((s) => s.type === "ban");
  const pickSteps = turnOrder.filter((s) => s.type === "pick");

  if (banSteps.length > 0) {
    groups.push({ label: "Ban Phase", steps: banSteps });
  }

  if (pickSteps.length > 0) {
    let pickNum = 1;
    let i = 0;
    while (i < pickSteps.length) {
      if (i === 0) {
        groups.push({ label: `Pick ${pickNum}`, steps: [pickSteps[i]!] });
        pickNum++;
        i++;
      } else if (i + 1 < pickSteps.length) {
        groups.push({
          label: `Pick ${pickNum}/${pickNum + 1}`,
          steps: [pickSteps[i]!, pickSteps[i + 1]!],
        });
        pickNum += 2;
        i += 2;
      } else {
        groups.push({ label: `Pick ${pickNum}`, steps: [pickSteps[i]!] });
        pickNum++;
        i++;
      }
    }
  }

  return groups;
}

function getCharacterIdForStep(
  step: TurnStep,
  draft: DraftState,
): { characterId: string | null; team: Team; noBan: boolean } {
  const team: Team = step.team === "both" ? "blue" : step.team;

  if (step.type === "ban") {
    const bans = team === "blue" ? draft.blueTeamBans : draft.redTeamBans;
    const acted = bans.length > step.index;
    if (!acted) return { characterId: null, team, noBan: false };
    const value = bans[step.index];
    return { characterId: value ?? null, team, noBan: value === null };
  }

  const picks = team === "blue" ? draft.blueTeamPicks : draft.redTeamPicks;
  return { characterId: picks[step.index] ?? null, team, noBan: false };
}

export function CharacterDraftOverlay({ draft, room }: CharacterDraftOverlayProps) {
  const blueName = room.blueTeamName || "BLUE";
  const redName = room.redTeamName || "RED";

  const selectedMap = draft.config.selectedMapName
    ? mapLookup.get(draft.config.selectedMapName)
    : null;

  const awakenings = room.revealedAwakenings
    ? room.revealedAwakenings
        .map((id) => awakeningMap.get(id))
        .filter(Boolean)
    : [];

  const groups = groupTurnSteps(draft.turnOrder);

  return (
    <div className="flex items-center gap-5">
      {selectedMap && (
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="relative overflow-hidden rounded-lg shrink-0"
            style={{ width: 180, height: 100, border: "2px solid rgba(255,255,255,0.2)" }}
          >
            <img
              src={selectedMap.icon}
              alt={selectedMap.name}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          </div>

          {awakenings.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {awakenings.map((awk) =>
                awk ? (
                  <div
                    key={awk.id}
                    className="overflow-hidden rounded-md shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      border: "2px solid rgba(255,255,255,0.15)",
                    }}
                  >
                    <img
                      src={awk.icon}
                      alt={awk.name}
                      style={{ objectFit: "cover", width: "100%", height: "100%" }}
                    />
                  </div>
                ) : null,
              )}
            </div>
          )}
        </div>
      )}

      <div
        className="shrink-0"
        style={{ width: 1, height: 100, background: "rgba(255,255,255,0.15)" }}
      />

      <div className="flex items-start gap-5">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col items-center gap-1">
            <span
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.6)", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
            >
              {group.label}
            </span>

            <div className="flex gap-2">
              {group.steps.map((step, i) => {
                const { characterId, team, noBan } = getCharacterIdForStep(step, draft);
                const isBanPhase = step.type === "ban";
                const teamName = team === "blue" ? blueName : redName;

                return (
                  <OverlayPortrait
                    key={`${group.label}-${i}`}
                    characterId={characterId}
                    team={team}
                    teamName={teamName}
                    showTeamLabel={isBanPhase}
                    noBan={noBan}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
