import { describe, it, expect } from "vitest";
import { generateTurnOrder } from "../draft/turnOrders.js";
import type { DraftConfig } from "../types.js";

function makeConfig(overrides: Partial<DraftConfig> = {}): DraftConfig {
  return {
    draftMode: "snake",
    banMode: "simultaneous",
    mirrorRule: "no_mirrors",
    timerSeconds: 30,
    numBans: 2,
    numPicks: 3,
    mapBanMode: "bo1",
    blueMapRole: "side_select",
    excludedMaps: [],
    ...overrides,
  };
}

describe("generateTurnOrder", () => {
  describe("Bo1 map steps", () => {
    it("generates S ban x3 then M pick (blue = side_select)", () => {
      const steps = generateTurnOrder(makeConfig());
      const mapSteps = steps.filter((s) => s.phase === "MAP_BAN");
      expect(mapSteps).toHaveLength(4);
      // blue = side_select bans 3, red = map_select picks 1
      expect(mapSteps.map((s) => s.team)).toEqual(["blue", "blue", "blue", "red"]);
      expect(mapSteps.map((s) => s.type)).toEqual(["map_ban", "map_ban", "map_ban", "map_pick"]);
    });

    it("respects blueMapRole: map_select", () => {
      const steps = generateTurnOrder(makeConfig({ blueMapRole: "map_select" }));
      const mapSteps = steps.filter((s) => s.phase === "MAP_BAN");
      // red = side_select bans 3, blue = map_select picks 1
      expect(mapSteps.map((s) => s.team)).toEqual(["red", "red", "red", "blue"]);
      expect(mapSteps.map((s) => s.type)).toEqual(["map_ban", "map_ban", "map_ban", "map_pick"]);
    });
  });

  describe("Bo3 map steps", () => {
    it("generates S ban, M ban, S pick, M pick, S ban, M ban", () => {
      const steps = generateTurnOrder(makeConfig({
        mapBanMode: "bo3",
        blueMapRole: "side_select",
      }));
      const mapSteps = steps.filter((s) => s.phase === "MAP_BAN");
      expect(mapSteps).toHaveLength(6);
      // blue = side_select, red = map_select
      expect(mapSteps.map((s) => s.team)).toEqual(["blue", "red", "blue", "red", "blue", "red"]);
      expect(mapSteps.map((s) => s.type)).toEqual([
        "map_ban", "map_ban", "map_pick", "map_pick", "map_ban", "map_ban",
      ]);
    });
  });

  describe("awakening reveal steps", () => {
    it("generates blue-first awakening picks", () => {
      const steps = generateTurnOrder(makeConfig());
      const awakenings = steps.filter((s) => s.phase === "AWAKENING_REVEAL");
      expect(awakenings).toHaveLength(2);
      expect(awakenings[0]!.team).toBe("blue");
      expect(awakenings[1]!.team).toBe("red");
      expect(awakenings.every((s) => s.type === "awakening_pick")).toBe(true);
    });
  });

  describe("character ban steps", () => {
    it("generates staggered bans (alternating)", () => {
      const steps = generateTurnOrder(makeConfig({ banMode: "staggered", numBans: 2 }));
      const bans = steps.filter((s) => s.phase === "CHAR_BAN");
      expect(bans).toHaveLength(4);
      expect(bans.map((s) => s.team)).toEqual(["blue", "red", "blue", "red"]);
    });

    it("generates simultaneous bans", () => {
      const steps = generateTurnOrder(makeConfig({ banMode: "simultaneous", numBans: 2 }));
      const bans = steps.filter((s) => s.phase === "CHAR_BAN");
      expect(bans).toHaveLength(2);
      expect(bans.every((s) => s.team === "both")).toBe(true);
    });

    it("generates no bans when banMode is none", () => {
      const steps = generateTurnOrder(makeConfig({ banMode: "none" }));
      const bans = steps.filter((s) => s.phase === "CHAR_BAN");
      expect(bans).toHaveLength(0);
    });
  });

  describe("character pick steps", () => {
    it("generates alternating picks (B, R, B, R, B, R)", () => {
      const steps = generateTurnOrder(makeConfig({ draftMode: "alternating", numPicks: 3 }));
      const picks = steps.filter((s) => s.phase === "CHAR_PICK");
      expect(picks).toHaveLength(6);
      expect(picks.map((s) => s.team)).toEqual(["blue", "red", "blue", "red", "blue", "red"]);
    });

    it("generates snake picks (B, R, R, B, B, R)", () => {
      const steps = generateTurnOrder(makeConfig({ draftMode: "snake", numPicks: 3 }));
      const picks = steps.filter((s) => s.phase === "CHAR_PICK");
      expect(picks).toHaveLength(6);
      expect(picks.map((s) => s.team)).toEqual(["blue", "red", "red", "blue", "blue", "red"]);
    });

    it("generates simultaneous picks", () => {
      const steps = generateTurnOrder(makeConfig({ draftMode: "simultaneous", numPicks: 3 }));
      const picks = steps.filter((s) => s.phase === "CHAR_PICK");
      expect(picks).toHaveLength(3);
      expect(picks.every((s) => s.team === "both")).toBe(true);
    });

    it("assigns correct indices per team", () => {
      const steps = generateTurnOrder(makeConfig({ draftMode: "snake", numPicks: 3 }));
      const picks = steps.filter((s) => s.phase === "CHAR_PICK");
      // B(0), R(0), R(1), B(1), B(2), R(2)
      expect(picks.map((s) => s.index)).toEqual([0, 0, 1, 1, 2, 2]);
    });
  });

  describe("full turn order structure", () => {
    it("flows MAP_BAN → AWAKENING_REVEAL → CHAR_BAN → CHAR_PICK", () => {
      const steps = generateTurnOrder(makeConfig());
      const phases = steps.map((s) => s.phase);
      const uniquePhases = [...new Set(phases)];
      expect(uniquePhases).toEqual(["MAP_BAN", "AWAKENING_REVEAL", "CHAR_BAN", "CHAR_PICK"]);
    });

    it("skips CHAR_BAN when banMode is none", () => {
      const steps = generateTurnOrder(makeConfig({ banMode: "none" }));
      const phases = [...new Set(steps.map((s) => s.phase))];
      expect(phases).toEqual(["MAP_BAN", "AWAKENING_REVEAL", "CHAR_PICK"]);
    });

    it("skips AWAKENING_REVEAL when includeAwakenings is false", () => {
      const steps = generateTurnOrder(makeConfig(), { includeAwakenings: false });
      const phases = [...new Set(steps.map((s) => s.phase))];
      expect(phases).not.toContain("AWAKENING_REVEAL");
      expect(phases).toEqual(["MAP_BAN", "CHAR_BAN", "CHAR_PICK"]);
    });
  });
});
