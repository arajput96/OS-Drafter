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
        "relative flex size-10 items-center justify-center rounded-md border",
        isActive
          ? team === "blue"
            ? "border-team-blue/60 bg-team-blue/10 animate-pulse"
            : "border-team-red/60 bg-team-red/10 animate-pulse"
          : "border-border/50 bg-secondary/50",
      )}
    >
      {character ? (
        <>
          <Image
            src={character.icon}
            alt={character.name}
            fill
            sizes="40px"
            className="rounded-md object-cover grayscale"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/40 rounded-md">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              className="size-5 text-destructive"
            >
              <line x1="4" y1="4" x2="20" y2="20" />
              <line x1="20" y1="4" x2="4" y2="20" />
            </svg>
          </div>
        </>
      ) : (
        <span className="text-[10px] text-muted-foreground">BAN</span>
      )}
    </div>
  );
}
