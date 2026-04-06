import type { Team } from "@shared/types";
import { CHARACTERS } from "@shared/index";

const characterMap = new Map(CHARACTERS.map((c) => [c.id, c]));

interface OverlayPortraitProps {
  characterId: string | null;
  team: Team;
  teamName?: string;
  showTeamLabel?: boolean;
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
          <img
            src={character.icon}
            alt={character.name}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        ) : noBan ? (
          <img
            src="/assets/no-ban.svg"
            alt="No Ban"
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        ) : null}
      </div>

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
