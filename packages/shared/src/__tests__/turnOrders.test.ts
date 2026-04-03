import { describe, it, expect } from "vitest";
import { generateTurnOrder } from "../draft/turnOrders.js";
import type { DraftConfig } from "../types.js";

function makeMapConfig(overrides: Partial<DraftConfig> = {}): DraftConfig {
  return {
    draftType: "map",
    draftMode: "snake",
    banMode: "simultaneous",
    mirrorRule: "no_mirrors",
    timerSeconds: 30,
    numBans: 0,
    numPicks: 1,
    mapBanMode: "bo1",
    blueMapRole: "side_select",
    excludedMaps: [],
    ...overrides,
  };
}

function makeCharConfig(overrides: Partial<DraftConfig> = {}): DraftConfig {
  return {
    draftType: "character",
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
  describe("map draft - Bo1", () => {
    it("generates S ban x3 then M pick (blue = side_select)", () => {
      const steps = generateTurnOrder(makeMapConfig());
      expect(steps).toHaveLength(4);
      expect(steps.map((s) => s.team)).toEqual(["blue", "blue", "blue", "red"]);
      expect(steps.map((s) => s.type)).toEqual(["map_ban", "map_ban", "map_ban", "map_pick"]);
    });

    it("respects blueMapRole: map_select", () => {
      const steps = generateTurnOrder(makeMapConfig({ blueMapRole: "map_select" }));
      // red = side_select bans 3, blue = map_select picks 1
      expect(steps.map((s) => s.team)).toEqual(["red", "red", "red", "blue"]);
      expect(steps.map((s) => s.type)).toEqual(["map_ban", "map_ban", "map_ban", "map_pick"]);
    });

    it("only contains MAP_BAN phase steps", () => {
      const steps = generateTurnOrder(makeMapConfig());
      expect(steps.every((s) => s.phase === "MAP_BAN")).toBe(true);
    });
  });

  describe("map draft - Bo3", () => {
    it("generates S ban, M ban, S pick, M pick, S ban, M ban", () => {
      const steps = generateTurnOrder(makeMapConfig({
        mapBanMode: "bo3",
        blueMapRole: "side_select",
      }));
      expect(steps).toHaveLength(6);
      // blue = side_select, red = map_select
      expect(steps.map((s) => s.team)).toEqual(["blue", "red", "blue", "red", "blue", "red"]);
      expect(steps.map((s) => s.type)).toEqual([
        "map_ban", "map_ban", "map_pick", "map_pick", "map_ban", "map_ban",
      ]);
    });
  });

  describe("character draft - ban steps", () => {
    it("generates staggered bans (alternating)", () => {
      const steps = generateTurnOrder(makeCharConfig({ banMode: "staggered", numBans: 2 }));
      const bans = steps.filter((s) => s.phase === "CHAR_BAN");
      expect(bans).toHaveLength(4);
      expect(bans.map((s) => s.team)).toEqual(["blue", "red", "blue", "red"]);
    });

    it("generates simultaneous bans", () => {
      const steps = generateTurnOrder(makeCharConfig({ banMode: "simultaneous", numBans: 2 }));
      const bans = steps.filter((s) => s.phase === "CHAR_BAN");
      expect(bans).toHaveLength(2);
      expect(bans.every((s) => s.team === "both")).toBe(true);
    });

    it("generates no bans when banMode is none", () => {
      const steps = generateTurnOrder(makeCharConfig({ banMode: "none" }));
      const bans = steps.filter((s) => s.phase === "CHAR_BAN");
      expect(bans).toHaveLength(0);
    });
  });

  describe("character draft - pick steps", () => {
    it("generates alternating picks (B, R, B, R, B, R)", () => {
      const steps = generateTurnOrder(makeCharConfig({ draftMode: "alternating", numPicks: 3 }));
      const picks = steps.filter((s) => s.phase === "CHAR_PICK");
      expect(picks).toHaveLength(6);
      expect(picks.map((s) => s.team)).toEqual(["blue", "red", "blue", "red", "blue", "red"]);
    });

    it("generates snake picks (B, R, R, B, B, R)", () => {
      const steps = generateTurnOrder(makeCharConfig({ draftMode: "snake", numPicks: 3 }));
      const picks = steps.filter((s) => s.phase === "CHAR_PICK");
      expect(picks).toHaveLength(6);
      expect(picks.map((s) => s.team)).toEqual(["blue", "red", "red", "blue", "blue", "red"]);
    });

    it("generates simultaneous picks", () => {
      const steps = generateTurnOrder(makeCharConfig({ draftMode: "simultaneous", numPicks: 3 }));
      const picks = steps.filter((s) => s.phase === "CHAR_PICK");
      expect(picks).toHaveLength(3);
      expect(picks.every((s) => s.team === "both")).toBe(true);
    });

    it("assigns correct indices per team", () => {
      const steps = generateTurnOrder(makeCharConfig({ draftMode: "snake", numPicks: 3 }));
      const picks = steps.filter((s) => s.phase === "CHAR_PICK");
      // B(0), R(0), R(1), B(1), B(2), R(2)
      expect(picks.map((s) => s.index)).toEqual([0, 0, 1, 1, 2, 2]);
    });
  });

  describe("full turn order structure", () => {
    it("map draft only contains MAP_BAN steps", () => {
      const steps = generateTurnOrder(makeMapConfig());
      const phases = [...new Set(steps.map((s) => s.phase))];
      expect(phases).toEqual(["MAP_BAN"]);
    });

    it("character draft flows CHAR_BAN → CHAR_PICK", () => {
      const steps = generateTurnOrder(makeCharConfig());
      const phases = [...new Set(steps.map((s) => s.phase))];
      expect(phases).toEqual(["CHAR_BAN", "CHAR_PICK"]);
    });

    it("character draft with no bans flows CHAR_PICK only", () => {
      const steps = generateTurnOrder(makeCharConfig({ banMode: "none" }));
      const phases = [...new Set(steps.map((s) => s.phase))];
      expect(phases).toEqual(["CHAR_PICK"]);
    });

    it("map draft has no character steps", () => {
      const steps = generateTurnOrder(makeMapConfig());
      expect(steps.filter((s) => s.phase === "CHAR_BAN")).toHaveLength(0);
      expect(steps.filter((s) => s.phase === "CHAR_PICK")).toHaveLength(0);
    });

    it("character draft has no map steps", () => {
      const steps = generateTurnOrder(makeCharConfig());
      expect(steps.filter((s) => s.phase === "MAP_BAN")).toHaveLength(0);
    });
  });
});
