"use client";

import { useEffect, useState } from "react";
import type { DraftState, Team } from "@os-drafter/shared";
import { cn } from "@/lib/utils";
import { characterMap } from "@/lib/character-utils";
import { CharacterGrid } from "./character-grid";
import { SideTeamPanel } from "./side-team-panel";
import { Button } from "@/components/ui/button";
import { Lock, Ban, Download } from "lucide-react";

interface CharacterDraftPhaseProps {
  draft: DraftState;
  myTeam: Team | null;
  selectedId: string | null;
  onSelect?: (characterId: string) => void;
  onLockIn?: () => void;
  onSkipBan?: () => void;
  isComplete?: boolean;
  downloading?: boolean;
  onDownload?: () => void;
  blueTeamName?: string;
  redTeamName?: string;
}

export function CharacterDraftPhase({
  draft,
  myTeam,
  selectedId,
  onSelect,
  onLockIn,
  onSkipBan,
  isComplete,
  downloading,
  onDownload,
  blueTeamName,
  redTeamName,
}: CharacterDraftPhaseProps) {
  const isMyTurn =
    draft.currentTurn === "both" || draft.currentTurn === myTeam;
  const canLock = isMyTurn && selectedId !== null && myTeam !== null;
  const selectedCharacter = selectedId ? characterMap.get(selectedId) : null;

  // Suppress overflow-y-auto during the grid's initial stagger animation so
  // the scrollbar doesn't briefly appear from transient layout. After the
  // animation settles, allow scrolling only if content genuinely overflows.
  const [canScroll, setCanScroll] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setCanScroll(true), 700);
    return () => clearTimeout(t);
  }, []);

  // Check if we already have a pending action (simultaneous mode)
  const hasPending =
    myTeam && draft.pendingActions?.[myTeam] !== undefined
      ? draft.pendingActions[myTeam] !== null
      : false;

  return (
    <div className="flex h-full gap-4 lg:gap-6">
      {/* Blue Team Panel — left side */}
      <div className="hidden lg:flex shrink-0">
        <SideTeamPanel team="blue" draft={draft} previewId={myTeam === "blue" ? selectedId : null} blueTeamName={blueTeamName} redTeamName={redTeamName} />
      </div>

      {/* Center: Grid + Lock-in */}
      <div className="flex-1 flex flex-col items-center gap-3 min-h-0">
        <div className={cn("w-full max-w-3xl px-2", canScroll ? "overflow-y-auto" : "overflow-hidden")}>
          <CharacterGrid
            draft={draft}
            myTeam={myTeam}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </div>

        {/* Lock-in button area (or Download Results when draft complete) */}
        {isComplete ? (
          onDownload && (
            <div className="flex justify-center shrink-0">
              <Button
                onClick={onDownload}
                disabled={downloading}
                size="lg"
                variant="gradient"
                className="gap-2 px-8"
              >
                <Download className="size-4" />
                {downloading ? "Saving..." : "Download Results"}
              </Button>
            </div>
          )
        ) : (
          myTeam && (
            <div className="flex justify-center shrink-0">
              {hasPending ? (
                <p className="text-sm text-muted-foreground animate-pulse">
                  Waiting for opponent...
                </p>
              ) : (
                <div className="flex gap-3">
                  {draft.phase === "CHAR_BAN" && onSkipBan && (
                    <Button
                      onClick={onSkipBan}
                      disabled={!isMyTurn}
                      size="lg"
                      variant="outline"
                      className="gap-2 px-8"
                    >
                      <Ban className="size-4" />
                      No Ban
                    </Button>
                  )}
                  <Button
                    onClick={onLockIn}
                    disabled={!canLock}
                    size="lg"
                    variant="gradient"
                    className={cn("gap-2 px-8 transition-transform", canLock && "scale-105")}
                  >
                    {draft.phase === "CHAR_BAN" ? <Ban className="size-4" /> : <Lock className="size-4" />}
                    {draft.phase === "CHAR_BAN"
                      ? selectedCharacter ? `Ban ${selectedCharacter.name}` : "Ban"
                      : selectedCharacter ? `Lock In ${selectedCharacter.name}` : "Lock In"}
                  </Button>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Red Team Panel — right side */}
      <div className="hidden lg:flex shrink-0">
        <SideTeamPanel team="red" draft={draft} previewId={myTeam === "red" ? selectedId : null} blueTeamName={blueTeamName} redTeamName={redTeamName} />
      </div>
    </div>
  );
}
