import { describe, it, expect } from "vitest";
import { generateTurnOrder } from "../draft/turnOrders.js";
import type { DraftConfig } from "../types.js";

function makeConfig(overrides: Partial<DraftConfig> = {}): DraftConfig {
  return {
    draftMode: "alternating",
    banMode: "staggered",
    mirrorRule: "no_mirrors",
    timerSeconds: 30,
    numBans: 2,
    numPicks: 3,
    numMapBans: 2,
    ...overrides,
  };
}

describe("generateTurnOrder", () => {
  describe("map ban steps", () => {
    it("generates alternating map bans (blue first)", () => {
      const steps = generateTurnOrder(makeConfig({ numMapBans: 2 }));
      const mapBans = steps.filter((s) => s.phase === "MAP_BAN");
      expect(mapBans).toHaveLength(4); // 2 per team
      expect(mapBans.map((s) => s.team)).toEqual(["blue", "red", "blue", "red"]);
      expect(mapBans.every((s) => s.type === "map_ban")).toBe(true);
    });

    it("skips map bans when numMapBans is 0", () => {
      const steps = generateTurnOrder(makeConfig({ numMapBans: 0 }));
      const mapBans = steps.filter((s) => s.phase === "MAP_BAN");
      expect(mapBans).toHaveLength(0);
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
  });
});
