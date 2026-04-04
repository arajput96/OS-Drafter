"use client";

import type { Team } from "@os-drafter/shared";
import { CHARACTERS } from "@os-drafter/shared";

const characterMap = new Map(CHARACTERS.map((c) => [c.id, c]));

interface OverlayPortraitProps {
  characterId: string | null;
  team: Team;
  teamName?: string;
  showTeamLabel?: boolean;
  /** True when the player explicitly chose "no ban" */
  noBan?: boolean;
}

export function OverlayPortrait({
  characterId,
  team,
  teamName,
  showTeamLabel,
  noBan,
}: OverlayPortraitProps) {
  const character = characterId ? characterMap.get(characterId) : null;
  const isFilled = !!character || noBan;
  const borderColor =
    team === "blue" ? "var(--overlay-blue)" : "var(--overlay-red)";

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Portrait */}
      <div
        className="relative overflow-hidden rounded-lg"
        style={{
          width: 80,
          height: 80,
          border: `3px solid ${isFilled ? borderColor : "rgba(255,255,255,0.15)"}`,
          background: isFilled ? "transparent" : "rgba(255,255,255,0.05)",
        }}
      >
        {character ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={character.icon}
            alt={character.name}
            width={80}
            height={80}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        ) : noBan ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src="/assets/no-ban.svg"
            alt="No Ban"
            width={80}
            height={80}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        ) : null}
      </div>

      {/* Team label below portrait (ban phase only) */}
      {showTeamLabel && (
        <span
          className="text-[10px] font-bold uppercase"
          style={{
            color: borderColor,
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            height: 14,
          }}
        >
          {isFilled ? teamName : ""}
        </span>
      )}
    </div>
  );
}
