"use client";

import { motion } from "framer-motion";
import { Ban, UserPlus } from "lucide-react";
import { CHARACTERS } from "@os-drafter/shared";
import type { DraftState, Team } from "@os-drafter/shared";
import { cn } from "@/lib/utils";
import { CharacterCard, type CharacterCardState } from "./character-card";

const gridContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.02 },
  },
};

const gridItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
};

interface CharacterGridProps {
  draft: DraftState;
  myTeam: Team | null;
  selectedId: string | null;
  onSelect?: (characterId: string) => void;
}

function getCharacterState(
  id: string,
  draft: DraftState,
  myTeam: Team | null,
  selectedId: string | null,
): CharacterCardState {
  if (selectedId === id) return "selected";

  const allBans = [...draft.blueTeamBans, ...draft.redTeamBans];
  if (allBans.includes(id)) return "banned";

  const allPicks = [...draft.blueTeamPicks, ...draft.redTeamPicks];
  if (allPicks.includes(id)) return "picked";

  // Check mirror rule unavailability
  if (myTeam && draft.config.mirrorRule === "no_mirrors") {
    const opponentPicks =
      myTeam === "blue" ? draft.redTeamPicks : draft.blueTeamPicks;
    if (opponentPicks.includes(id)) return "unavailable";
  }
  if (myTeam && draft.config.mirrorRule === "team_mirrors") {
    const myPicks =
      myTeam === "blue" ? draft.blueTeamPicks : draft.redTeamPicks;
    if (myPicks.includes(id)) return "unavailable";
  }

  // In simultaneous mode, if opponent has a pending action matching this id, it's hidden
  // so we don't need to handle that client-side (server hides it)

  return "available";
}

export function CharacterGrid({
  draft,
  myTeam,
  selectedId,
  onSelect,
}: CharacterGridProps) {
  const isMyTurn =
    draft.currentTurn === "both" || draft.currentTurn === myTeam;
  const isCharPhase =
    draft.phase === "CHAR_BAN" || draft.phase === "CHAR_PICK";
  const canInteract = isMyTurn && isCharPhase && myTeam !== null;

  const headerText =
    draft.phase === "CHAR_BAN" ? "Ban a Striker" : "Choose a Striker";

  return (
    <div>
      <div className={cn(
        "mb-3 flex items-center justify-center gap-2 rounded-md py-1.5 text-sm font-medium uppercase tracking-wider",
        draft.currentTurn === "blue" && "bg-team-blue/10 text-team-blue",
        draft.currentTurn === "red" && "bg-team-red/10 text-team-red",
        draft.currentTurn === "both" && "bg-primary/10 text-primary",
      )}>
        {draft.phase === "CHAR_BAN" ? <Ban className="size-4" /> : <UserPlus className="size-4" />}
        {headerText}
      </div>
      <motion.div
        key={draft.phase}
        className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-7"
        variants={gridContainer}
        initial="hidden"
        animate="visible"
      >
        {CHARACTERS.map((character) => {
          const state = getCharacterState(
            character.id,
            draft,
            myTeam,
            selectedId,
          );
          return (
            <motion.div key={character.id} variants={gridItem} className="w-full">
              <CharacterCard
                character={character}
                state={state}
                onClick={
                  canInteract && state === "available"
                    ? () => onSelect?.(character.id)
                    : undefined
                }
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
