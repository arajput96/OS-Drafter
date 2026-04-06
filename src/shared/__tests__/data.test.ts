import { describe, it, expect } from "vitest";
import { CHARACTERS } from "../data/characters";
import { MAPS } from "../data/maps";
import { AWAKENINGS, AWAKENING_EXCLUSIONS, CURRENT_AWAKENING_POOL, pickTwoAwakenings } from "../data/awakenings";

describe("Game Data Integrity", () => {
  describe("Characters", () => {
    it("has 21 characters", () => {
      expect(CHARACTERS).toHaveLength(21);
    });

    it("has unique IDs", () => {
      const ids = CHARACTERS.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("has unique names", () => {
      const names = CHARACTERS.map((c) => c.name);
      expect(new Set(names).size).toBe(names.length);
    });

    it("has valid icon paths", () => {
      for (const char of CHARACTERS) {
        expect(char.icon).toMatch(/^\/assets\/characters\/.+\.png$/);
      }
    });
  });

  describe("Maps", () => {
    it("has 10 maps", () => {
      expect(MAPS).toHaveLength(10);
    });

    it("has unique IDs", () => {
      const ids = MAPS.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("has unique names", () => {
      const names = MAPS.map((m) => m.name);
      expect(new Set(names).size).toBe(names.length);
    });

    it("has valid icon paths", () => {
      for (const map of MAPS) {
        expect(map.icon).toMatch(/^\/assets\/maps\/.+\.png$/);
      }
    });
  });

  describe("Awakenings", () => {
    it("has 55 awakenings", () => {
      expect(AWAKENINGS).toHaveLength(55);
    });

    it("has unique IDs", () => {
      const ids = AWAKENINGS.map((a) => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("has unique names", () => {
      const names = AWAKENINGS.map((a) => a.name);
      expect(new Set(names).size).toBe(names.length);
    });

    it("has valid icon paths", () => {
      for (const awk of AWAKENINGS) {
        expect(awk.icon).toMatch(/^\/assets\/awakenings\/.+\.png$/);
      }
    });
  });

  describe("Awakening Exclusions", () => {
    const awakeningIds = new Set(AWAKENINGS.map((a) => a.id));

    it("all excluder keys exist in AWAKENINGS", () => {
      for (const key of Object.keys(AWAKENING_EXCLUSIONS)) {
        expect(awakeningIds).toContain(key);
      }
    });

    it("all excluded IDs exist in AWAKENINGS", () => {
      for (const [, excluded] of Object.entries(AWAKENING_EXCLUSIONS)) {
        for (const id of excluded) {
          expect(awakeningIds).toContain(id);
        }
      }
    });

    it("no awakening excludes itself", () => {
      for (const [id, excluded] of Object.entries(AWAKENING_EXCLUSIONS)) {
        expect(excluded).not.toContain(id);
      }
    });

    it("exclusions are bidirectional", () => {
      for (const [id, excluded] of Object.entries(AWAKENING_EXCLUSIONS)) {
        for (const other of excluded) {
          const otherExclusions = AWAKENING_EXCLUSIONS[other];
          expect(otherExclusions, `${other} should exclude ${id}`).toBeDefined();
          expect(otherExclusions).toContain(id);
        }
      }
    });

    it("all CURRENT_AWAKENING_POOL IDs exist in AWAKENINGS", () => {
      for (const id of CURRENT_AWAKENING_POOL) {
        expect(awakeningIds).toContain(id);
      }
    });
  });

  describe("pickTwoAwakenings", () => {
    it("returns two distinct awakenings from the pool", () => {
      const pool = ["a1", "a2", "a3", "a4"];
      for (let i = 0; i < 50; i++) {
        const [first, second] = pickTwoAwakenings(pool, {});
        expect(first).not.toBe(second);
        expect(pool).toContain(first);
        expect(pool).toContain(second);
      }
    });

    it("respects exclusion rules", () => {
      const pool = ["a1", "a2", "a3"];
      const exclusions = { a1: ["a2"], a2: ["a1"] };
      for (let i = 0; i < 100; i++) {
        const [first, second] = pickTwoAwakenings(pool, exclusions);
        if (first === "a1") expect(second).not.toBe("a2");
        if (first === "a2") expect(second).not.toBe("a1");
      }
    });

    it("throws when no valid pair exists", () => {
      const pool = ["a1", "a2"];
      const exclusions = { a1: ["a2"], a2: ["a1"] };
      expect(() => pickTwoAwakenings(pool, exclusions)).toThrow("No valid awakening pair");
    });

    it("throws when pool has fewer than 2 entries", () => {
      expect(() => pickTwoAwakenings(["a1"], {})).toThrow();
    });

    it("ignores out-of-pool IDs in exclusion lists", () => {
      const pool = ["a1", "a2", "a3"];
      const exclusions = { a1: ["x1", "x2"] };
      for (let i = 0; i < 50; i++) {
        const [first, second] = pickTwoAwakenings(pool, exclusions);
        expect(pool).toContain(first);
        expect(pool).toContain(second);
      }
    });

    it("works with CURRENT_AWAKENING_POOL and real exclusions", () => {
      for (let i = 0; i < 100; i++) {
        const [first, second] = pickTwoAwakenings(CURRENT_AWAKENING_POOL);
        expect(CURRENT_AWAKENING_POOL).toContain(first);
        expect(CURRENT_AWAKENING_POOL).toContain(second);
        expect(first).not.toBe(second);
        const excluded = AWAKENING_EXCLUSIONS[first] ?? [];
        expect(excluded).not.toContain(second);
      }
    });
  });
});
