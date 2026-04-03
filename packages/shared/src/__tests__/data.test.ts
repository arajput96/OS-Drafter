import { describe, it, expect } from "vitest";
import { CHARACTERS } from "../data/characters.js";
import { MAPS } from "../data/maps.js";
import { AWAKENINGS } from "../data/awakenings.js";

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
});
