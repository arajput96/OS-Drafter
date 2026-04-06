import type { GameMap, Team } from "@shared/types";

export type OverlayMapStatus = "empty" | "banned" | "picked";

interface OverlayMapCardProps {
  map: GameMap | null;
  status: OverlayMapStatus;
  team?: Team;
  teamName?: string;
}

export function OverlayMapCard({
  map,
  status,
  team,
  teamName,
}: OverlayMapCardProps) {
  const borderColor =
    status === "empty" || !team
      ? "rgba(255,255,255,0.15)"
      : team === "blue"
        ? "var(--overlay-blue)"
        : "var(--overlay-red)";

  return (
    <div className="flex flex-col items-center gap-1" style={{ width: 180 }}>
      <div
        className="text-xs font-bold uppercase tracking-wider"
        style={{
          color: borderColor,
          height: 16,
          textShadow: "0 1px 4px rgba(0,0,0,0.8)",
        }}
      >
        {status !== "empty" && teamName ? teamName : ""}
      </div>

      <div
        className="relative overflow-hidden rounded-lg"
        style={{
          width: 160,
          height: 90,
          border: `3px solid ${borderColor}`,
          background: map ? "transparent" : "rgba(255,255,255,0.03)",
        }}
      >
        {map && (
          <img
            src={map.icon}
            alt={map.name}
            style={{
              objectFit: "cover",
              width: "100%",
              height: "100%",
              filter: status === "banned" ? "grayscale(0.7) brightness(0.5)" : "none",
            }}
          />
        )}

        {status === "banned" && map && (
          <svg
            viewBox="0 0 160 90"
            className="absolute inset-0"
            style={{ width: "100%", height: "100%" }}
          >
            <line
              x1="0"
              y1="0"
              x2="160"
              y2="90"
              stroke={team === "blue" ? "var(--overlay-blue)" : "var(--overlay-red)"}
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      <span
        className="text-[11px] font-medium"
        style={{
          color: map ? "#fff" : "rgba(255,255,255,0.2)",
          textShadow: map ? "0 1px 4px rgba(0,0,0,0.8)" : "none",
          height: 16,
        }}
      >
        {map ? map.name : ""}
      </span>
    </div>
  );
}
