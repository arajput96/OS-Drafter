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
  onSkipBan?: () => void;
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
  onSkipBan,
}: DraftBoardProps) {
  const opponentDisconnected =
    myTeam === "blue" ? !room.redConnected :
    myTeam === "red" ? !room.blueConnected :
    false;

  const isCharacterDraft = draft.config.draftType === "character";
  const revealedAwakenings = room.revealedAwakenings;
  const isCharPhase = draft.phase === "CHAR_BAN" || draft.phase === "CHAR_PICK";

  return (
    <div className={isCharPhase ? "flex flex-col h-[calc(100vh-4.5rem)]" : "flex flex-col gap-4"}>
      {/* Opponent disconnect banner */}
      {opponentDisconnected && draft.phase !== "COMPLETE" && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-center text-sm text-yellow-400 shrink-0">
          Opponent disconnected. Waiting for reconnection...
        </div>
      )}

      {/* Spectator label */}
      {!myTeam && (
        <p className="text-center text-xs text-muted-foreground shrink-0">Spectating</p>
      )}

      {/* Header */}
      {draft.phase !== "COMPLETE" && (
        isCharPhase ? (
          /* Compact horizontal top bar for character draft */
          <div className="grid grid-cols-3 items-center px-2 py-2 shrink-0">
            <div className="flex flex-col gap-0.5">
              <PhaseBanner phase={draft.phase} myTeam={myTeam} className="text-sm text-left" />
              <TurnIndicator
                currentTurn={draft.currentTurn}
                myTeam={myTeam}
                isCharacterDraft={isCharacterDraft}
                phase={draft.phase}
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <TimerDisplay seconds={timerRemaining} className="text-3xl" />
              {isCharacterDraft && revealedAwakenings && (
                <AwakeningDisplay awakeningIds={revealedAwakenings} showLabel={false} large />
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              {isCharacterDraft && draft.config.selectedMapName && (
                <p className="text-sm text-muted-foreground">
                  Map: <span className="font-semibold text-foreground">{draft.config.selectedMapName}</span>
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Original centered header for map phase */
          <div className="flex flex-col items-center gap-2">
            <PhaseBanner phase={draft.phase} myTeam={myTeam} />
            <TimerDisplay seconds={timerRemaining} />
            <TurnIndicator
              currentTurn={draft.currentTurn}
              myTeam={myTeam}
              isCharacterDraft={isCharacterDraft}
              phase={draft.phase}
            />
          </div>
        )
      )}

      {/* Map name + awakenings for non-char phases */}
      {!isCharPhase && isCharacterDraft && draft.config.selectedMapName && draft.phase !== "COMPLETE" && (
        <p className="text-center text-xs text-muted-foreground">
          Map: <span className="font-semibold text-foreground">{draft.config.selectedMapName}</span>
        </p>
      )}
      {!isCharPhase && isCharacterDraft && revealedAwakenings && draft.phase !== "COMPLETE" && (
        <AwakeningDisplay awakeningIds={revealedAwakenings} />
      )}

      {/* Phase-specific UI */}
      {draft.phase === "MAP_BAN" && (
        <MapBanPhase draft={draft} myTeam={myTeam} onBanMap={onBanMap} onPickMap={onPickMap} />
      )}
      {isCharPhase && (
        <div className="flex-1 min-h-0">
          <CharacterDraftPhase
            draft={draft}
            myTeam={myTeam}
            selectedId={selectedId}
            onSelect={onSelectCharacter}
            onLockIn={onLockIn}
            onSkipBan={onSkipBan}
          />
        </div>
      )}
      {draft.phase === "COMPLETE" && <DraftComplete draft={draft} room={room} />}
    </div>
  );
}

function TurnIndicator({
  currentTurn,
  myTeam,
  isCharacterDraft,
  phase,
}: {
  currentTurn: "blue" | "red" | "both";
  myTeam: Team | null;
  isCharacterDraft: boolean;
  phase: string;
}) {
  const isMyTurn = currentTurn === "both" || currentTurn === myTeam;

  if (!myTeam) {
    // Spectator
    const bothLabel = phase === "CHAR_BAN" ? "Both teams banning" : "Both teams picking";
    const label =
      currentTurn === "both"
        ? bothLabel
        : isCharacterDraft
          ? `${currentTurn === "blue" ? "Blue" : "Red"}'s turn`
          : `${currentTurn === "blue" ? "Side Select" : "Map Select"}'s turn`;
    const spectatorColor =
      currentTurn === "both"
        ? "text-muted-foreground"
        : currentTurn === "blue"
          ? "text-team-blue"
          : "text-team-red";
    return <p className={`text-sm ${spectatorColor}`}>{label}</p>;
  }

  const teamColorClass = myTeam === "blue" ? "text-team-blue" : "text-team-red";

  return (
    <p className={`text-sm font-medium ${isMyTurn ? teamColorClass : "text-muted-foreground"}`}>
      {isMyTurn ? "Your turn" : "Opponent's turn"}
    </p>
  );
}
