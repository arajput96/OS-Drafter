"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { Team } from "@os-drafter/shared";
import { cn } from "@/lib/utils";
import { characterMap, getCharacterSplashPath } from "@/lib/character-utils";

interface BottomPickCardProps {
  characterId: string | null;
  team: Team;
  slotType: "ban" | "pick";
  isActive: boolean;
  previewId?: string | null;
}

export function BottomPickCard({
  characterId,
  team,
  slotType,
  isActive,
  previewId,
}: BottomPickCardProps) {
  const character = characterId ? characterMap.get(characterId) : null;
  const previewCharacter = previewId ? characterMap.get(previewId) : null;
  const isBlue = team === "blue";

  return (
    <div
      className={cn(
        "relative flex overflow-hidden rounded-lg border-2 transition-all",
        "w-[180px] h-[110px] md:w-[210px] md:h-[125px] lg:w-[240px] lg:h-[140px]",
        // Active empty slot: glow + pulse
        isActive && !character && isBlue &&
          "border-team-blue shadow-[0_0_12px_rgba(59,130,246,0.5)] animate-pulse",
        isActive && !character && !isBlue &&
          "border-team-red shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse",
        // Filled slot
        character && slotType === "pick" && isBlue && "border-team-blue/60",
        character && slotType === "pick" && !isBlue && "border-team-red/60",
        character && slotType === "ban" && "border-border/50",
        // Active empty slot: scale up
        isActive && !character && "scale-105",
        // Inactive empty slot
        !isActive && !character && isBlue && "border-team-blue/20 bg-team-blue/5",
        !isActive && !character && !isBlue && "border-team-red/20 bg-team-red/5",
      )}
    >
      {character ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={characterId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" as const }}
            className="relative w-full h-full"
          >
            {/* Team gradient background behind transparent splash art */}
            <div className={cn(
              "absolute inset-0",
              slotType === "ban"
                ? "bg-gradient-to-br from-secondary to-secondary/50"
                : isBlue
                  ? "bg-gradient-to-br from-team-blue/30 to-team-blue/10"
                  : "bg-gradient-to-br from-team-red/30 to-team-red/10",
            )} />
            <Image
              src={getCharacterSplashPath(character.name)}
              alt={character.name}
              fill
              sizes="240px"
              className={cn(
                "object-cover object-[center_20%] scale-125",
                slotType === "ban"
                  ? "grayscale"
                  : isBlue
                    ? "brightness-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    : "brightness-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]",
              )}
            />
            {/* Vignette overlay — darkens edges, brightens center */}
            <div className="absolute inset-0 shadow-[inset_0_0_30px_12px_rgba(0,0,0,0.7)]" />
            {slotType === "ban" && (
              <div className="absolute inset-0 bg-black/30" />
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
              <span className={cn(
                "block text-[10px] font-medium leading-tight truncate text-white",
                slotType === "ban" && "text-muted-foreground",
              )}>
                {character.name}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      ) : previewCharacter ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={previewCharacter.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full h-full"
          >
            <div className={cn(
              "absolute inset-0",
              isBlue
                ? "bg-gradient-to-br from-team-blue/20 to-team-blue/5"
                : "bg-gradient-to-br from-team-red/20 to-team-red/5",
            )} />
            <Image
              src={getCharacterSplashPath(previewCharacter.name)}
              alt={previewCharacter.name}
              fill
              sizes="240px"
              className="object-cover object-[center_20%] scale-125"
            />
            <div className="absolute inset-0 shadow-[inset_0_0_30px_12px_rgba(0,0,0,0.7)]" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
              <span className="block text-[10px] font-medium leading-tight truncate text-white">
                {previewCharacter.name}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="flex-1 flex items-center justify-center gap-2">
          <span
            className={cn(
              "text-lg font-bold",
              isActive
                ? isBlue ? "text-team-blue" : "text-team-red"
                : "text-muted-foreground/30",
            )}
          >
            ?
          </span>
          <span
            className={cn(
              "text-[10px] font-medium uppercase tracking-wider",
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
