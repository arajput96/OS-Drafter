"use client";

import type { DraftState, Team } from "@os-drafter/shared";
import { CharacterGrid } from "./character-grid";
import { BottomTeamBar } from "./bottom-team-bar";
import { Button } from "@/components/ui/button";
import { Lock, Ban } from "lucide-react";

interface CharacterDraftPhaseProps {
  draft: DraftState;
  myTeam: Team | null;
  selectedId: string | null;
  onSelect?: (characterId: string) => void;
  onLockIn?: () => void;
  onSkipBan?: () => void;
}

export function CharacterDraftPhase({
  draft,
  myTeam,
  selectedId,
  onSelect,
  onLockIn,
  onSkipBan,
}: CharacterDraftPhaseProps) {
  const isMyTurn =
    draft.currentTurn === "both" || draft.currentTurn === myTeam;
  const canLock = isMyTurn && selectedId !== null && myTeam !== null;

  // Check if we already have a pending action (simultaneous mode)
  const hasPending =
    myTeam && draft.pendingActions?.[myTeam] !== undefined
      ? draft.pendingActions[myTeam] !== null
      : false;

  return (
    <div className="flex flex-col h-full">
      {/* Centered grid + buttons */}
      <div className="flex-1 flex flex-col items-center gap-3 min-h-0">
        <div className="w-full max-w-3xl overflow-y-auto px-2">
          <CharacterGrid
            draft={draft}
            myTeam={myTeam}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </div>

        {/* Lock-in button area */}
        {myTeam && (
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
                  className="gap-2 px-8"
                >
                  <Lock className="size-4" />
                  Lock In
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom team bar */}
      <BottomTeamBar draft={draft} className="shrink-0 pt-4" />
    </div>
  );
}
