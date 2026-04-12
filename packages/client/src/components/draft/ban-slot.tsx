import Image from "next/image";
import type { Team } from "@os-drafter/shared";
import { CHARACTERS } from "@os-drafter/shared";
import { cn } from "@/lib/utils";

const characterMap = new Map(CHARACTERS.map((c) => [c.id, c]));

interface BanSlotProps {
  characterId: string | null;
  team: Team;
  isActive?: boolean;
}

export function BanSlot({ characterId, team, isActive }: BanSlotProps) {
  const character = characterId ? characterMap.get(characterId) : null;

  return (
    <div
      className={cn(
        "relative flex h-14 w-full items-center gap-2 rounded-lg border px-2",
        isActive
          ? team === "blue"
            ? "border-team-blue/60 bg-team-blue/10 animate-pulse"
            : "border-team-red/60 bg-team-red/10 animate-pulse"
          : "border-border/40 bg-secondary/30",
      )}
    >
      {character ? (
        <>
          <div className="relative size-10 shrink-0 overflow-hidden rounded-md">
            <Image
              src={character.icon}
              alt={character.name}
              fill
              sizes="40px"
              className="object-cover grayscale"
            />
            <div className="absolute bottom-0 right-0 flex size-4 items-center justify-center rounded-tl-sm bg-destructive/80">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={4}
                className="size-2.5 text-white"
              >
                <line x1="4" y1="4" x2="20" y2="20" />
                <line x1="20" y1="4" x2="4" y2="20" />
              </svg>
            </div>
          </div>
          <span className="text-sm font-medium truncate text-muted-foreground">{character.name}</span>
        </>
      ) : (
        <span className="text-xs text-muted-foreground">Ban</span>
      )}
    </div>
  );
}
