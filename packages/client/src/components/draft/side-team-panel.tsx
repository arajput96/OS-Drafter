import type { DraftState, Team } from "@os-drafter/shared";
import { cn } from "@/lib/utils";
import { getTeamLabel } from "@/lib/team-utils";
import { BottomPickCard } from "./bottom-pick-card";

interface SideTeamPanelProps {
  team: Team;
  draft: DraftState;
  previewId?: string | null;
  className?: string;
  blueTeamName?: string;
  redTeamName?: string;
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

function padSlots(arr: (string | null)[], total: number): (string | null)[] {
  if (arr.length >= total) return arr;
  return [...arr, ...Array<null>(total - arr.length).fill(null)];
}

export function SideTeamPanel({ team, draft, previewId, className, blueTeamName, redTeamName }: SideTeamPanelProps) {
  const { numBans, numPicks } = draft.config;
  const bans = padSlots(
    team === "blue" ? draft.blueTeamBans : draft.redTeamBans,
    numBans,
  );
  const picks = padSlots(
    team === "blue" ? draft.blueTeamPicks : draft.redTeamPicks,
    numPicks,
  );
  const active = getActiveSlotInfo(draft);
  const isBlue = team === "blue";

  function isSlotActive(type: "ban" | "pick", index: number) {
    if (!active) return false;
    return (
      active.type === type &&
      (active.team === team || active.team === "both") &&
      active.index === index
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className={cn(
          "text-xs font-bold uppercase tracking-wider",
          isBlue ? "text-team-blue" : "text-team-red",
        )}
      >
        {getTeamLabel(team, blueTeamName, redTeamName)}
      </div>
      <div className="flex flex-col gap-1.5">
        {bans.map((id, i) => {
          const slotActive = isSlotActive("ban", i);
          return (
            <BottomPickCard
              key={`${team}-ban-${i}`}
              characterId={id}
              team={team}
              slotType="ban"
              isActive={slotActive}
              previewId={slotActive && !id ? previewId : undefined}
            />
          );
        })}
        {picks.map((id, i) => {
          const slotActive = isSlotActive("pick", i);
          return (
            <BottomPickCard
              key={`${team}-pick-${i}`}
              characterId={id}
              team={team}
              slotType="pick"
              isActive={slotActive}
              previewId={slotActive && !id ? previewId : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
