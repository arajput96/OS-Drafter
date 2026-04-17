import type { Team } from "@os-drafter/shared";

export function getTeamLabel(
  team: Team,
  blueTeamName?: string,
  redTeamName?: string,
): string {
  if (team === "blue") return blueTeamName || "Blue";
  return redTeamName || "Red";
}
