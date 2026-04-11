"use client";

import { useState, useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";
import type { DraftState, RoomState, Team } from "@os-drafter/shared";
import { PhaseBanner } from "@/components/ui/phase-banner";
import { TimerDisplay } from "@/components/ui/timer-display";
import { Button } from "@/components/ui/button";
import { MapBanPhase } from "./map-ban-phase";
import { CharacterDraftPhase } from "./character-draft-phase";
import { DraftSummaryCapture } from "./draft-summary-capture";
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
  // Track the last active (non-COMPLETE) phase so we can keep rendering it
  const [frozenPhase, setFrozenPhase] = useState<DraftState["phase"]>(
    draft.phase === "COMPLETE" ? getLastActivePhase(draft) : draft.phase,
  );

  // Sync frozenPhase for non-COMPLETE transitions (React 19 render-time update)
  if (draft.phase !== "COMPLETE" && draft.phase !== frozenPhase) {
    setFrozenPhase(draft.phase);
  }

  const isComplete = draft.phase === "COMPLETE";
  const renderPhase = isComplete ? frozenPhase : draft.phase;
  const isCharPhase = renderPhase === "CHAR_BAN" || renderPhase === "CHAR_PICK";

  const opponentDisconnected =
    myTeam === "blue" ? !room.redConnected :
    myTeam === "red" ? !room.blueConnected :
    false;

  const isCharacterDraft = draft.config.draftType === "character";
  const revealedAwakenings = room.revealedAwakenings;

  // --- Image download ---
  const captureRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!captureRef.current || downloading) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(captureRef.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = "draft-results.png";
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  }, [downloading]);

  return (
    <div className={isCharPhase ? "flex flex-col h-[calc(100vh-3.5rem)]" : "flex flex-col gap-4"}>
      {/* Opponent disconnect banner */}
      {opponentDisconnected && !isComplete && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-center text-sm text-yellow-400 shrink-0">
          Opponent disconnected. Waiting for reconnection...
        </div>
      )}

      {/* Spectator label */}
      {!myTeam && (
        <p className="text-center text-xs text-muted-foreground shrink-0">Spectating</p>
      )}

      {/* Header — replaced with "Draft Complete" banner when done */}
      {isComplete ? (
        <div className="relative flex items-center justify-center px-2 py-3 shrink-0">
          <h2 className="text-xl font-bold text-primary">Draft Complete</h2>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            size="sm"
            variant="outline"
            className="absolute right-2 gap-2"
          >
            <Download className="size-4" />
            {downloading ? "Saving..." : "Download Results"}
          </Button>
        </div>
      ) : (
        isCharPhase ? (
          /* Compact horizontal top bar for character draft */
          <div className="grid grid-cols-3 items-center px-2 py-3 shrink-0">
            <div className="flex flex-col gap-0.5">
              <PhaseBanner phase={renderPhase} myTeam={myTeam} className="text-sm text-left" />
              <TurnIndicator
                currentTurn={draft.currentTurn}
                myTeam={myTeam}
                isCharacterDraft={isCharacterDraft}
                phase={renderPhase}
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <TimerDisplay seconds={timerRemaining} maxSeconds={draft.config.timerSeconds} className="text-3xl" />
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
            <PhaseBanner phase={renderPhase} myTeam={myTeam} />
            <TimerDisplay seconds={timerRemaining} />
            <TurnIndicator
              currentTurn={draft.currentTurn}
              myTeam={myTeam}
              isCharacterDraft={isCharacterDraft}
              phase={renderPhase}
            />
          </div>
        )
      )}

      {/* Map name + awakenings for non-char phases */}
      {!isCharPhase && isCharacterDraft && draft.config.selectedMapName && !isComplete && (
        <p className="text-center text-xs text-muted-foreground">
          Map: <span className="font-semibold text-foreground">{draft.config.selectedMapName}</span>
        </p>
      )}
      {!isCharPhase && isCharacterDraft && revealedAwakenings && !isComplete && (
        <AwakeningDisplay awakeningIds={revealedAwakenings} />
      )}

      {/* Phase-specific UI — stays frozen when draft is complete */}
      {renderPhase === "MAP_BAN" && (
        <MapBanPhase
          draft={draft}
          myTeam={myTeam}
          isComplete={isComplete}
          onBanMap={isComplete ? undefined : onBanMap}
          onPickMap={isComplete ? undefined : onPickMap}
        />
      )}
      {isCharPhase && (
        <div className="flex-1 min-h-0">
          <CharacterDraftPhase
            draft={draft}
            myTeam={myTeam}
            selectedId={isComplete ? null : selectedId}
            onSelect={isComplete ? undefined : onSelectCharacter}
            onLockIn={isComplete ? undefined : onLockIn}
            onSkipBan={isComplete ? undefined : onSkipBan}
          />
        </div>
      )}

      {/* Offscreen capture target for image download */}
      {isComplete && (
        <div className="fixed -left-[9999px]" aria-hidden>
          <DraftSummaryCapture ref={captureRef} draft={draft} room={room} />
        </div>
      )}
    </div>
  );
}

/** Infer what phase was active before COMPLETE (for page-load-when-already-done). */
function getLastActivePhase(draft: DraftState): DraftState["phase"] {
  return draft.config.draftType === "character" ? "CHAR_PICK" : "MAP_BAN";
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
