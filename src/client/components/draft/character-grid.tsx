import { CHARACTERS } from "@shared/index";
import type { DraftState, Team } from "@shared/types";
import { CharacterCard, type CharacterCardState } from "./character-card";

interface CharacterGridProps {
  draft: DraftState;
  myTeam: Team | null;
  selectedId: string | null;
  onSelect?: (characterId: string) => void;
}

function getCharacterState(
  id: string,
  draft: DraftState,
  myTeam: Team | null,
  selectedId: string | null,
): CharacterCardState {
  if (selectedId === id) return "selected";

  const allBans = [...draft.blueTeamBans, ...draft.redTeamBans];
  if (allBans.includes(id)) return "banned";

  const allPicks = [...draft.blueTeamPicks, ...draft.redTeamPicks];
  if (allPicks.includes(id)) return "picked";

  if (myTeam && draft.config.mirrorRule === "no_mirrors") {
    const opponentPicks =
      myTeam === "blue" ? draft.redTeamPicks : draft.blueTeamPicks;
    if (opponentPicks.includes(id)) return "unavailable";
  }
  if (myTeam && draft.config.mirrorRule === "team_mirrors") {
    const myPicks =
      myTeam === "blue" ? draft.blueTeamPicks : draft.redTeamPicks;
    if (myPicks.includes(id)) return "unavailable";
  }

  return "available";
}

export function CharacterGrid({
  draft,
  myTeam,
  selectedId,
  onSelect,
}: CharacterGridProps) {
  const isMyTurn =
    draft.currentTurn === "both" || draft.currentTurn === myTeam;
  const isCharPhase =
    draft.phase === "CHAR_BAN" || draft.phase === "CHAR_PICK";
  const canInteract = isMyTurn && isCharPhase && myTeam !== null;

  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
      {CHARACTERS.map((character) => {
        const state = getCharacterState(
          character.id,
          draft,
          myTeam,
          selectedId,
        );
        return (
          <CharacterCard
            key={character.id}
            character={character}
            state={state}
            onClick={
              canInteract && state === "available"
                ? () => onSelect?.(character.id)
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
