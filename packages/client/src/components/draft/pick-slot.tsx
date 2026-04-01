import Image from "next/image";
import type { Team } from "@os-drafter/shared";
import { CHARACTERS } from "@os-drafter/shared";
import { cn } from "@/lib/utils";

const characterMap = new Map(CHARACTERS.map((c) => [c.id, c]));

interface PickSlotProps {
  characterId: string | null;
  team: Team;
  isActive?: boolean;
}

export function PickSlot({ characterId, team, isActive }: PickSlotProps) {
  const character = characterId ? characterMap.get(characterId) : null;

  return (
    <div
      className={cn(
        "relative flex h-14 w-full items-center gap-2 rounded-lg border px-2",
        isActive
          ? team === "blue"
            ? "border-team-blue/60 bg-team-blue/10 animate-pulse"
            : "border-team-red/60 bg-team-red/10 animate-pulse"
          : character
            ? team === "blue"
              ? "border-team-blue/30 bg-team-blue/5"
              : "border-team-red/30 bg-team-red/5"
            : "border-border/30 bg-secondary/30",
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
              className="object-cover"
            />
          </div>
          <span className="text-sm font-medium truncate">{character.name}</span>
        </>
      ) : (
        <span className="text-xs text-muted-foreground">Pick</span>
      )}
    </div>
  );
}
