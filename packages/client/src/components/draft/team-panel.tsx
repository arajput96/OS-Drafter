import type { Team, DraftState } from "@os-drafter/shared";
import { AWAKENINGS } from "@os-drafter/shared";
import { cn } from "@/lib/utils";
import { BanSlot } from "./ban-slot";
import { PickSlot } from "./pick-slot";
import Image from "next/image";

const awakeningMap = new Map(AWAKENINGS.map((a) => [a.id, a]));

interface TeamPanelProps {
  team: Team;
  draft: DraftState;
  className?: string;
}

function getActiveSlotInfo(
  draft: DraftState,
): { type: "ban" | "pick"; team: Team | "both"; index: number } | null {
  if (draft.phase !== "CHAR_BAN" && draft.phase !== "CHAR_PICK") return null;
  const step = draft.turnOrder[draft.turnIndex];
  if (!step) return null;
  return {
    type: step.type as "ban" | "pick",
    team: step.team,
    index: step.index,
  };
}

export function TeamPanel({ team, draft, className }: TeamPanelProps) {
  const bans = team === "blue" ? draft.blueTeamBans : draft.redTeamBans;
  const picks = team === "blue" ? draft.blueTeamPicks : draft.redTeamPicks;
  const awakeningId =
    team === "blue"
      ? draft.awakeningReveal.blueChoice
      : draft.awakeningReveal.redChoice;
  const awakening = awakeningId ? awakeningMap.get(awakeningId) : null;

  const active = getActiveSlotInfo(draft);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-3",
        team === "blue"
          ? "border-team-blue/20 bg-team-blue/5"
          : "border-team-red/20 bg-team-red/5",
        className,
      )}
    >
      <div
        className={cn(
          "text-center text-sm font-bold uppercase tracking-wider",
          team === "blue" ? "text-team-blue" : "text-team-red",
        )}
      >
        {team === "blue" ? "Side Select" : "Map Select"}
      </div>

      {/* Awakening */}
      {awakening && (
        <div className="flex items-center gap-2 rounded-md border border-border/30 bg-secondary/30 px-2 py-1">
          <div className="relative size-6 shrink-0 overflow-hidden rounded">
            <Image
              src={awakening.icon}
              alt={awakening.name}
              fill
              sizes="24px"
              className="object-cover"
            />
          </div>
          <span className="text-xs">{awakening.name}</span>
        </div>
      )}

      {/* Bans */}
      {bans.length > 0 && (
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            Bans
          </div>
          <div className="flex flex-wrap gap-1">
            {bans.map((id, i) => (
              <BanSlot
                key={i}
                characterId={id}
                team={team}
                isActive={
                  active?.type === "ban" &&
                  (active.team === team || active.team === "both") &&
                  active.index === i &&
                  id === null
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Picks */}
      <div className="flex flex-col gap-1.5">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Picks
        </div>
        {picks.map((id, i) => (
          <PickSlot
            key={i}
            characterId={id}
            team={team}
            isActive={
              active?.type === "pick" &&
              (active.team === team || active.team === "both") &&
              active.index === i &&
              id === null
            }
          />
        ))}
      </div>
    </div>
  );
}
