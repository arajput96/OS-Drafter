"use client";

import type { DraftState, RoomState, Team } from "@os-drafter/shared";
import { PhaseBanner } from "@/components/ui/phase-banner";
import { TimerDisplay } from "@/components/ui/timer-display";
import { MapBanPhase } from "./map-ban-phase";
import { CharacterDraftPhase } from "./character-draft-phase";
import { DraftComplete } from "./draft-complete";
import { AwakeningDisplay } from "./awakening-display";

interface DraftBoardProps {
  draft: DraftState;
  room: RoomState;
  myTeam: Team | null;
  timerRemaining: number;
  selectedId: string | null;
  onBanMap?: (mapId: string) => void;
  onPickMap?: (mapId: string) => void;
  onSelectCharacter?: (characterId: string) => void;
  onLockIn?: () => void;
}

export function DraftBoard({
  draft,
  room,
  myTeam,
  timerRemaining,
  selectedId,
  onBanMap,
  onPickMap,
  onSelectCharacter,
  onLockIn,
}: DraftBoardProps) {
  const opponentDisconnected =
    myTeam === "blue" ? !room.redConnected :
    myTeam === "red" ? !room.blueConnected :
    false;

  const isCharacterDraft = draft.config.draftType === "character";
  const revealedAwakenings = room.revealedAwakenings;

  return (
    <div className="flex flex-col gap-4">
      {/* Opponent disconnect banner */}
      {opponentDisconnected && draft.phase !== "COMPLETE" && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-center text-sm text-yellow-400">
          Opponent disconnected. Waiting for reconnection...
        </div>
      )}

      {/* Spectator label */}
      {!myTeam && (
        <p className="text-center text-xs text-muted-foreground">Spectating</p>
      )}

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
            isCharacterDraft={isCharacterDraft}
          />
        )}
      </div>

      {/* Selected map name for character drafts */}
      {isCharacterDraft && draft.config.selectedMapName && draft.phase !== "COMPLETE" && (
        <p className="text-center text-xs text-muted-foreground">
          Map: <span className="font-semibold text-foreground">{draft.config.selectedMapName}</span>
        </p>
      )}

      {/* Shared awakenings for character drafts */}
      {isCharacterDraft && revealedAwakenings && draft.phase !== "COMPLETE" && (
        <AwakeningDisplay awakeningIds={revealedAwakenings} />
      )}

      {/* Phase-specific UI */}
      {draft.phase === "MAP_BAN" && (
        <MapBanPhase draft={draft} myTeam={myTeam} onBanMap={onBanMap} onPickMap={onPickMap} />
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
      {draft.phase === "COMPLETE" && <DraftComplete draft={draft} room={room} />}
    </div>
  );
}

function TurnIndicator({
  currentTurn,
  myTeam,
  isCharacterDraft,
}: {
  currentTurn: "blue" | "red" | "both";
  myTeam: Team | null;
  isCharacterDraft: boolean;
}) {
  const isMyTurn = currentTurn === "both" || currentTurn === myTeam;

  if (!myTeam) {
    // Spectator
    const label =
      currentTurn === "both"
        ? "Both teams picking"
        : isCharacterDraft
          ? `${currentTurn === "blue" ? "Blue" : "Red"}'s turn`
          : `${currentTurn === "blue" ? "Side Select" : "Map Select"}'s turn`;
    return <p className="text-sm text-muted-foreground">{label}</p>;
  }

  return (
    <p className={`text-sm font-medium ${isMyTurn ? "text-primary" : "text-muted-foreground"}`}>
      {isMyTurn ? "Your turn" : "Opponent's turn"}
    </p>
  );
}
