"use client";

import Image from "next/image";
import type { Character } from "@os-drafter/shared";
import { cn } from "@/lib/utils";

export type CharacterCardState =
  | "available"
  | "selected"
  | "banned"
  | "picked"
  | "unavailable";

interface CharacterCardProps {
  character: Character;
  state: CharacterCardState;
  onClick?: () => void;
}

export function CharacterCard({ character, state, onClick }: CharacterCardProps) {
  const isClickable = state === "available" || state === "selected";

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={cn(
        "group relative flex w-full flex-col items-center gap-1 rounded-lg border p-1.5 transition-all",
        state === "available" &&
          "border-border bg-secondary hover:border-primary hover:bg-secondary/80 cursor-pointer",
        state === "selected" &&
          "border-primary bg-primary/20 ring-2 ring-primary/50 cursor-pointer",
        state === "banned" &&
          "border-border/50 bg-secondary/40 opacity-50 cursor-not-allowed",
        state === "picked" &&
          "border-border/50 bg-secondary/40 opacity-40 cursor-not-allowed",
        state === "unavailable" &&
          "border-border/30 bg-secondary/20 opacity-30 cursor-not-allowed",
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-md">
        <Image
          src={character.icon}
          alt={character.name}
          fill
          sizes="80px"
          className={cn(
            "object-cover",
            (state === "banned" || state === "picked" || state === "unavailable") &&
              "grayscale",
          )}
        />
        {state === "banned" && (
          <div className="absolute inset-0 bg-destructive/20">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
              <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="4" className="text-destructive" />
            </svg>
          </div>
        )}
      </div>
      <span className="text-[10px] font-medium leading-tight text-center truncate w-full">
        {character.name}
      </span>
    </button>
  );
}
