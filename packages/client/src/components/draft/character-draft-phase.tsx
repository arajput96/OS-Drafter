"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { DraftState, Team } from "@os-drafter/shared";
import { MAPS } from "@os-drafter/shared";
import { cn } from "@/lib/utils";
import { characterMap } from "@/lib/character-utils";
import { CharacterGrid } from "./character-grid";
import { SideTeamPanel } from "./side-team-panel";
import { Button } from "@/components/ui/button";
import { Lock, Ban, Download } from "lucide-react";

const mapByName = new Map(MAPS.map((m) => [m.name, m]));

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
  const selectedMap = draft.config.selectedMapName
    ? mapByName.get(draft.config.selectedMapName)
    : null;

  // Suppress overflow-y-auto during the first-paint layout so the scrollbar
  // doesn't briefly appear from transient overflow on hydration. Re-enable
  // after two animation frames (layout has committed by then).
  const [canScroll, setCanScroll] = useState(false);
  useEffect(() => {
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setCanScroll(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
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

        {/* Map preview — below the action button */}
        {selectedMap && (
          <div className="shrink-0 relative w-full max-w-md overflow-hidden rounded-lg border border-border/50">
            <div className="relative aspect-[16/6] w-full">
              <Image
                src={selectedMap.icon}
                alt={selectedMap.name}
                fill
                sizes="448px"
                className="object-cover"
              />
              {/* Bottom gradient with centered map name */}
              <div
                className="absolute bottom-0 left-0 right-0 text-center text-xs font-bold uppercase tracking-wider text-white"
                style={{
                  background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.88))",
                  padding: "18px 6px 6px",
                  textShadow: "0 1px 3px rgba(0,0,0,1)",
                }}
              >
                {selectedMap.name}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Red Team Panel — right side */}
      <div className="hidden lg:flex shrink-0">
        <SideTeamPanel team="red" draft={draft} previewId={myTeam === "red" ? selectedId : null} blueTeamName={blueTeamName} redTeamName={redTeamName} />
      </div>
    </div>
  );
}
