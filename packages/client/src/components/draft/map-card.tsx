"use client";

import Image from "next/image";
import type { GameMap } from "@os-drafter/shared";
import { cn } from "@/lib/utils";

export type MapCardState = "available" | "banned" | "selected";

interface MapCardProps {
  map: GameMap;
  state: MapCardState;
  onClick?: () => void;
}

export function MapCard({ map, state, onClick }: MapCardProps) {
  const isClickable = state === "available";

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
      </div>
      <span className="text-xs font-medium">{map.name}</span>
    </button>
  );
}
