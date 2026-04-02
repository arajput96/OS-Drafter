import type { DraftConfig, Team } from "../types.js";

export function resolveMapRoles(config: DraftConfig): { sideSelect: Team; mapSelect: Team } {
  if (config.blueMapRole === "side_select") {
    return { sideSelect: "blue", mapSelect: "red" };
  }
  return { sideSelect: "red", mapSelect: "blue" };
}
