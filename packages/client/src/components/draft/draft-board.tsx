"use client";

import type { DraftState, Team } from "@os-drafter/shared";
import { PhaseBanner } from "@/components/ui/phase-banner";
import { TimerDisplay } from "@/components/ui/timer-display";
import { MapBanPhase } from "./map-ban-phase";
import { AwakeningPhase } from "./awakening-phase";
import { CharacterDraftPhase } from "./character-draft-phase";
import { DraftComplete } from "./draft-complete";

interface DraftBoardProps {
  draft: DraftState;
  myTeam: Team | null;
  timerRemaining: number;
  selectedId: string | null;
  onBanMap?: (mapId: string) => void;
  onPickAwakening?: (awakeningId: string) => void;
  onSelectCharacter?: (characterId: string) => void;
  onLockIn?: () => void;
}

export function DraftBoard({
  draft,
  myTeam,
  timerRemaining,
  selectedId,
  onBanMap,
  onPickAwakening,
  onSelectCharacter,
  onLockIn,
}: DraftBoardProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Header: Phase + Timer */}
      <div className="flex flex-col items-center gap-2">
        <PhaseBanner phase={draft.phase} />
        {draft.phase !== "COMPLETE" && (
          <TimerDisplay seconds={timerRemaining} />
        )}
        {draft.phase !== "COMPLETE" && (
          <TurnIndicator
            currentTurn={draft.currentTurn}
            myTeam={myTeam}
          />
        )}
      </div>

      {/* Phase-specific UI */}
      {draft.phase === "MAP_BAN" && (
        <MapBanPhase draft={draft} myTeam={myTeam} onBanMap={onBanMap} />
      )}
      {draft.phase === "AWAKENING_REVEAL" && (
        <AwakeningPhase
          draft={draft}
          myTeam={myTeam}
          onPickAwakening={onPickAwakening}
        />
      )}
      {(draft.phase === "CHAR_BAN" || draft.phase === "CHAR_PICK") && (
        <CharacterDraftPhase
          draft={draft}
          myTeam={myTeam}
          selectedId={selectedId}
          onSelect={onSelectCharacter}
          onLockIn={onLockIn}
        />
      )}
      {draft.phase === "COMPLETE" && <DraftComplete draft={draft} />}
    </div>
  );
}

function TurnIndicator({
  currentTurn,
  myTeam,
}: {
  currentTurn: "blue" | "red" | "both";
  myTeam: Team | null;
}) {
  const isMyTurn = currentTurn === "both" || currentTurn === myTeam;

  if (!myTeam) {
    // Spectator
    const label =
      currentTurn === "both"
        ? "Both teams picking"
        : `${currentTurn === "blue" ? "Blue" : "Red"} team's turn`;
    return <p className="text-sm text-muted-foreground">{label}</p>;
  }

  return (
    <p className={`text-sm font-medium ${isMyTurn ? "text-primary" : "text-muted-foreground"}`}>
      {isMyTurn ? "Your turn" : "Opponent's turn"}
    </p>
  );
}
