import type { DraftState, Team } from "@shared/types";
import { CharacterGrid } from "./character-grid";
import { TeamPanel } from "./team-panel";
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

  const hasPending =
    myTeam && draft.pendingActions?.[myTeam] !== undefined
      ? draft.pendingActions[myTeam] !== null
      : false;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      <div className="order-1 lg:order-1 lg:w-52 shrink-0">
        <TeamPanel team="blue" draft={draft} />
      </div>

      <div className="order-3 lg:order-2 flex-1 flex flex-col gap-4">
        <CharacterGrid
          draft={draft}
          myTeam={myTeam}
          selectedId={selectedId}
          onSelect={onSelect}
        />

        {myTeam && (
          <div className="flex justify-center">
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

      <div className="order-2 lg:order-3 lg:w-52 shrink-0">
        <TeamPanel team="red" draft={draft} />
      </div>
    </div>
  );
}
