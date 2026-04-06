import type { Character } from "@shared/types";
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
        "group relative flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-all",
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
        <img
          src={character.icon}
          alt={character.name}
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            (state === "banned" || state === "picked" || state === "unavailable") &&
              "grayscale",
          )}
        />
        {state === "banned" && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/30">
            <XIcon className="text-destructive" />
          </div>
        )}
      </div>
      <span className="text-[10px] font-medium leading-tight text-center truncate w-full">
        {character.name}
      </span>
    </button>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      className={cn("size-8", className)}
    >
      <line x1="4" y1="4" x2="20" y2="20" />
      <line x1="20" y1="4" x2="4" y2="20" />
    </svg>
  );
}
