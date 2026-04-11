import type { DraftState, Team } from "@os-drafter/shared";
import { BottomPickCard } from "./bottom-pick-card";

interface BottomTeamBarProps {
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

function padSlots(arr: (string | null)[], total: number): (string | null)[] {
  if (arr.length >= total) return arr;
  return [...arr, ...Array<null>(total - arr.length).fill(null)];
}

export function BottomTeamBar({ draft, className }: BottomTeamBarProps) {
  const { numBans, numPicks } = draft.config;
  const blueBans = padSlots(draft.blueTeamBans, numBans);
  const redBans = padSlots(draft.redTeamBans, numBans);
  const bluePicks = padSlots(draft.blueTeamPicks, numPicks);
  const redPicks = padSlots(draft.redTeamPicks, numPicks);
  const active = getActiveSlotInfo(draft);

  function isSlotActive(team: Team, type: "ban" | "pick", index: number) {
    if (!active) return false;
    return (
      active.type === type &&
      (active.team === team || active.team === "both") &&
      active.index === index
    );
  }

  return (
    <div className={className}>
      <div className="flex items-end justify-center gap-3 md:gap-4">
        {/* Blue team: Ban (outer) + Picks */}
        <div className="flex gap-1.5 md:gap-2">
          {blueBans.map((id, i) => (
            <BottomPickCard
              key={`blue-ban-${i}`}
              characterId={id}
              team="blue"
              slotType="ban"
              isActive={isSlotActive("blue", "ban", i)}
            />
          ))}
          {bluePicks.map((id, i) => (
            <BottomPickCard
              key={`blue-pick-${i}`}
              characterId={id}
              team="blue"
              slotType="pick"
              isActive={isSlotActive("blue", "pick", i)}
            />
          ))}
        </div>

        {/* VS Divider */}
        <div className="flex items-center self-center px-1 md:px-2">
          <span className="text-lg md:text-xl font-bold tracking-wider text-muted-foreground">
            VS
          </span>
        </div>

        {/* Red team: Picks + Ban (outer, mirrored) */}
        <div className="flex gap-1.5 md:gap-2">
          {redPicks.map((id, i) => (
            <BottomPickCard
              key={`red-pick-${i}`}
              characterId={id}
              team="red"
              slotType="pick"
              isActive={isSlotActive("red", "pick", i)}
            />
          ))}
          {redBans.map((id, i) => (
            <BottomPickCard
              key={`red-ban-${i}`}
              characterId={id}
              team="red"
              slotType="ban"
              isActive={isSlotActive("red", "ban", i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
