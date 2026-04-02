"use client";

import Image from "next/image";
import type { GameMap } from "@os-drafter/shared";
import { cn } from "@/lib/utils";

export type MapCardState = "available" | "banned" | "selected" | "picked_blue" | "picked_red";

interface MapCardProps {
  map: GameMap;
  state: MapCardState;
  gameLabel?: string;
  onClick?: () => void;
}

export function MapCard({ map, state, gameLabel, onClick }: MapCardProps) {
  const isClickable = state === "available";
  const isPicked = state === "picked_blue" || state === "picked_red";

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={cn(
        "group relative flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all",
        state === "available" &&
          "border-border bg-secondary hover:border-primary hover:bg-secondary/80 cursor-pointer",
        state === "selected" &&
          "border-primary bg-primary/20 ring-2 ring-primary/50 cursor-pointer",
        state === "banned" &&
          "border-border/50 bg-secondary/40 opacity-40 cursor-not-allowed",
        state === "picked_blue" &&
          "border-team-blue bg-team-blue/15 cursor-not-allowed",
        state === "picked_red" &&
          "border-team-red bg-team-red/15 cursor-not-allowed",
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-md">
        <Image
          src={map.icon}
          alt={map.name}
          fill
          sizes="200px"
          className={cn("object-cover", state === "banned" && "grayscale")}
        />
        {state === "banned" && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/30">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              className="size-10 text-destructive"
            >
              <line x1="4" y1="4" x2="20" y2="20" />
              <line x1="20" y1="4" x2="4" y2="20" />
            </svg>
          </div>
        )}
        {isPicked && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center",
            state === "picked_blue" ? "bg-team-blue/20" : "bg-team-red/20",
          )}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="size-10 text-primary">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
        {gameLabel && (
          <div className="absolute top-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {gameLabel}
          </div>
        )}
      </div>
      <span className="text-xs font-medium">{map.name}</span>
    </button>
  );
}
