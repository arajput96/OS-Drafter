"use client";

import type { DraftState, Team } from "@os-drafter/shared";
import { cn } from "@/lib/utils";
import { characterMap } from "@/lib/character-utils";
import { CharacterGrid } from "./character-grid";
import { SideTeamPanel } from "./side-team-panel";
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
  const selectedCharacter = selectedId ? characterMap.get(selectedId) : null;

  // Check if we already have a pending action (simultaneous mode)
  const hasPending =
    myTeam && draft.pendingActions?.[myTeam] !== undefined
      ? draft.pendingActions[myTeam] !== null
      : false;

  return (
    <div className="flex h-full gap-4 lg:gap-6">
      {/* Blue Team Panel — left side */}
      <div className="hidden lg:flex shrink-0">
        <SideTeamPanel team="blue" draft={draft} previewId={myTeam === "blue" ? selectedId : null} />
      </div>

      {/* Center: Grid + Lock-in */}
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
                  variant="gradient"
                  className={cn("gap-2 px-8 transition-transform", canLock && "scale-105")}
                >
                  <Lock className="size-4" />
                  {selectedCharacter ? `Lock In ${selectedCharacter.name}` : "Lock In"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Red Team Panel — right side */}
      <div className="hidden lg:flex shrink-0">
        <SideTeamPanel team="red" draft={draft} previewId={myTeam === "red" ? selectedId : null} />
      </div>
    </div>
  );
}
