import Image from "next/image";
import type { Team } from "@os-drafter/shared";
import { cn } from "@/lib/utils";
import { characterMap, getCharacterSplashPath } from "@/lib/character-utils";

interface BottomPickCardProps {
  characterId: string | null;
  team: Team;
  slotType: "ban" | "pick";
  isActive: boolean;
}

export function BottomPickCard({
  characterId,
  team,
  slotType,
  isActive,
}: BottomPickCardProps) {
  const character = characterId ? characterMap.get(characterId) : null;
  const isBlue = team === "blue";

  return (
    <div
      className={cn(
        "relative flex flex-col items-center overflow-hidden rounded-lg border-2 transition-all",
        "w-[80px] h-[110px] md:w-[100px] md:h-[140px] lg:w-[120px] lg:h-[160px]",
        // Active empty slot: glow + pulse
        isActive && !character && isBlue &&
          "border-team-blue shadow-[0_0_12px_rgba(59,130,246,0.5)] animate-pulse",
        isActive && !character && !isBlue &&
          "border-team-red shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse",
        // Filled slot
        character && slotType === "pick" && isBlue && "border-team-blue/60",
        character && slotType === "pick" && !isBlue && "border-team-red/60",
        character && slotType === "ban" && "border-border/50",
        // Inactive empty slot
        !isActive && !character && isBlue && "border-team-blue/20 bg-team-blue/5",
        !isActive && !character && !isBlue && "border-team-red/20 bg-team-red/5",
      )}
    >
      {character ? (
        <>
          <div className="relative flex-1 w-full overflow-hidden">
            <Image
              src={getCharacterSplashPath(character.name)}
              alt={character.name}
              fill
              sizes="120px"
              className={cn(
                "object-cover object-top",
                slotType === "ban" && "grayscale",
              )}
            />
            {slotType === "ban" && (
              <div className="absolute inset-0 bg-black/30" />
            )}
          </div>
          <div
            className={cn(
              "w-full py-0.5 text-center text-[10px] font-medium leading-tight truncate px-1",
              slotType === "ban" ? "bg-secondary/80 text-muted-foreground" : "bg-secondary/60",
            )}
          >
            {character.name}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span
            className={cn(
              "text-xs font-medium uppercase tracking-wider",
              isActive
                ? isBlue ? "text-team-blue" : "text-team-red"
                : "text-muted-foreground/50",
            )}
          >
            {slotType === "ban" ? "BAN" : "PICK"}
          </span>
        </div>
      )}
    </div>
  );
}
