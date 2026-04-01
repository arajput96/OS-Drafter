"use client";

import Image from "next/image";
import { AWAKENINGS } from "@os-drafter/shared";
import type { DraftState, Team } from "@os-drafter/shared";
import { cn } from "@/lib/utils";

const awakeningMap = new Map(AWAKENINGS.map((a) => [a.id, a]));

interface AwakeningPhaseProps {
  draft: DraftState;
  myTeam: Team | null;
  onPickAwakening?: (awakeningId: string) => void;
}

export function AwakeningPhase({
  draft,
  myTeam,
  onPickAwakening,
}: AwakeningPhaseProps) {
  const pair = draft.awakeningReveal.revealedPair;
  if (!pair) return null;

  const myChoice =
    myTeam === "blue"
      ? draft.awakeningReveal.blueChoice
      : myTeam === "red"
        ? draft.awakeningReveal.redChoice
        : null;

  const isMyTurn =
    draft.currentTurn === "both" || draft.currentTurn === myTeam;
  const canPick =
    isMyTurn && draft.phase === "AWAKENING_REVEAL" && myTeam !== null && !myChoice;

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground">
        {myChoice
          ? "Waiting for opponent to pick..."
          : canPick
            ? "Choose your awakening"
            : "Awakening selection in progress"}
      </p>
      <div className="flex gap-6">
        {pair.map((id) => {
          const awakening = awakeningMap.get(id);
          if (!awakening) return null;

          const isSelected = myChoice === id;
          return (
            <button
              key={id}
              onClick={canPick ? () => onPickAwakening?.(id) : undefined}
              disabled={!canPick}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                isSelected
                  ? "border-primary bg-primary/20 ring-2 ring-primary/50"
                  : canPick
                    ? "border-border bg-secondary hover:border-primary cursor-pointer"
                    : "border-border/50 bg-secondary/50",
              )}
            >
              <div className="relative size-20 overflow-hidden rounded-lg">
                <Image
                  src={awakening.icon}
                  alt={awakening.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <span className="text-sm font-medium">{awakening.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
