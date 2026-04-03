import { describe, it, expect, beforeEach } from "vitest";
import { DraftMachine } from "../draft/DraftMachine.js";
import { NO_BAN } from "../types.js";
import type { DraftConfig, Team, DraftMode, BanMode, MirrorRule } from "../types.js";

// Small rosters for focused testing
const CHARS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10"];
const MAP_IDS = ["m1", "m2", "m3", "m4", "m5", "m6", "m7"];
const AWK_IDS = ["a1", "a2", "a3", "a4"];

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
    numBans: 1,
    numPicks: 3,
    mapBanMode: "bo1",
    blueMapRole: "side_select",
    excludedMaps: [],
    selectedMapName: "Test Map",
    ...overrides,
  };
}

function createMapMachine(overrides: Partial<DraftConfig> = {}): DraftMachine {
  return new DraftMachine(makeMapConfig(overrides), [], MAP_IDS, []);
}

function createCharMachine(overrides: Partial<DraftConfig> = {}): DraftMachine {
  return new DraftMachine(makeCharConfig(overrides), CHARS, [], AWK_IDS);
}

/** Helper: run through all map phase steps (bans + picks) */
function completeMapPhase(machine: DraftMachine): void {
  const state = machine.getState();
  const mapSteps = state.turnOrder.filter((s) => s.phase === "MAP_BAN");
  const pool = [...state.mapBans.mapPool];
  let idx = 0;
  for (const step of mapSteps) {
    const team = step.team as Team;
    const mapId = pool[idx++]!;
    if (step.type === "map_pick") {
      const result = machine.pickMap(team, mapId);
      expect(result.ok).toBe(true);
    } else {
      const result = machine.banMap(team, mapId);
      expect(result.ok).toBe(true);
    }
  }
}

/** Helper: run through all character ban steps */
function completeCharBans(machine: DraftMachine): void {
  const state = machine.getState();
  const banSteps = state.turnOrder.filter((s) => s.phase === "CHAR_BAN");
  const available = CHARS.filter(
    (id) =>
      !state.blueTeamBans.includes(id) &&
      !state.redTeamBans.includes(id),
  );
  let idx = 0;

  for (const step of banSteps) {
    if (step.team === "both") {
      machine.banCharacter("blue", available[idx++]!);
      machine.banCharacter("red", available[idx++]!);
    } else {
      machine.banCharacter(step.team as Team, available[idx++]!);
    }
  }
}

/** Helper: run through all character pick steps */
function completeCharPicks(machine: DraftMachine): void {
  const state = machine.getState();
  const pickSteps = state.turnOrder.filter((s) => s.phase === "CHAR_PICK");

  for (const step of pickSteps) {
    if (step.team === "both") {
      const blueAvail = machine.getAvailableCharacters("blue");
      const redAvail = machine.getAvailableCharacters("red");
      machine.pickCharacter("blue", blueAvail[0]!);
      machine.pickCharacter("red", redAvail[redAvail.length - 1]!);
    } else {
      const team = step.team as Team;
      const avail = machine.getAvailableCharacters(team);
      const result = machine.pickCharacter(team, avail[0]!);
      expect(result.ok).toBe(true);
    }
  }
}

describe("DraftMachine", () => {
  describe("initialization", () => {
    it("starts in WAITING phase", () => {
      const machine = createMapMachine();
      expect(machine.getState().phase).toBe("WAITING");
    });

    it("has empty ban and pick arrays", () => {
      const machine = createCharMachine();
      const state = machine.getState();
      expect(state.blueTeamBans).toEqual([]);
      expect(state.redTeamBans).toEqual([]);
      expect(state.blueTeamPicks).toEqual([]);
      expect(state.redTeamPicks).toEqual([]);
    });

    it("has generated turn order", () => {
      const machine = createMapMachine();
      expect(machine.getState().turnOrder.length).toBeGreaterThan(0);
    });
  });

  describe("map draft - start", () => {
    it("transitions from WAITING to MAP_BAN", () => {
      const machine = createMapMachine();
      const result = machine.start();
      expect(result.ok).toBe(true);
      expect(machine.getState().phase).toBe("MAP_BAN");
    });

    it("rejects start when already started", () => {
      const machine = createMapMachine();
      machine.start();
      const result = machine.start();
      expect(result.ok).toBe(false);
    });
  });

  describe("character draft - start", () => {
    it("transitions from WAITING to CHAR_BAN", () => {
      const machine = createCharMachine();
      const result = machine.start();
      expect(result.ok).toBe(true);
      expect(machine.getState().phase).toBe("CHAR_BAN");
    });

    it("skips to CHAR_PICK when banMode is none", () => {
      const machine = createCharMachine({ banMode: "none" });
      machine.start();
      expect(machine.getState().phase).toBe("CHAR_PICK");
    });
  });

  describe("awakening reveal", () => {
    it("reveals a random pair of awakenings", () => {
      const machine = createCharMachine();
      machine.revealAwakenings();
      const pair = machine.getState().awakeningReveal.revealedPair;
      expect(pair).not.toBeNull();
      expect(pair).toHaveLength(2);
      expect(AWK_IDS).toContain(pair![0]);
      expect(AWK_IDS).toContain(pair![1]);
    });

    it("does not reveal awakenings if fewer than 2 available", () => {
      const machine = new DraftMachine(makeCharConfig(), CHARS, [], ["a1"]);
      machine.revealAwakenings();
      expect(machine.getState().awakeningReveal.revealedPair).toBeNull();
    });
  });

  describe("map draft - Bo1", () => {
    let machine: DraftMachine;

    beforeEach(() => {
      // Bo1 default: blue = side_select, red = map_select
      // Flow: blue ban, blue ban, blue ban, red pick
      machine = createMapMachine();
      machine.start();
    });

    it("allows side select (blue) to ban maps", () => {
      const result = machine.banMap("blue", "m1");
      expect(result.ok).toBe(true);
      expect(machine.getState().mapBans.blueBans).toContain("m1");
    });

    it("rejects ban from map select (red) during ban steps", () => {
      const result = machine.banMap("red", "m1");
      expect(result.ok).toBe(false);
    });

    it("rejects banning already-banned map", () => {
      machine.banMap("blue", "m1");
      const result = machine.banMap("blue", "m1");
      expect(result.ok).toBe(false);
    });

    it("rejects banning non-existent map", () => {
      const result = machine.banMap("blue", "nonexistent");
      expect(result.ok).toBe(false);
    });

    it("allows map select (red) to pick after all bans", () => {
      machine.banMap("blue", "m1");
      machine.banMap("blue", "m2");
      machine.banMap("blue", "m3");
      // Now it should be red's turn to pick
      const result = machine.pickMap("red", "m4");
      expect(result.ok).toBe(true);
      expect(machine.getState().mapBans.selectedMap).toBe("m4");
    });

    it("rejects picking a banned map", () => {
      machine.banMap("blue", "m1");
      machine.banMap("blue", "m2");
      machine.banMap("blue", "m3");
      const result = machine.pickMap("red", "m1");
      expect(result.ok).toBe(false);
    });

    it("transitions to COMPLETE after map phase completes", () => {
      completeMapPhase(machine);
      expect(machine.getState().phase).toBe("COMPLETE");
      expect(machine.isComplete()).toBe(true);
    });
  });

  describe("map draft - Bo3", () => {
    let machine: DraftMachine;

    beforeEach(() => {
      machine = createMapMachine({ mapBanMode: "bo3" });
      machine.start();
    });

    it("completes with game order filled", () => {
      completeMapPhase(machine);
      expect(machine.getState().phase).toBe("COMPLETE");
      const gameOrder = machine.getState().mapBans.gameOrder;
      // All 3 games should have maps
      expect(gameOrder[0]).toBeTruthy();
      expect(gameOrder[1]).toBeTruthy();
      expect(gameOrder[2]).toBeTruthy();
    });

    it("filters excluded maps from the pool", () => {
      const m = createMapMachine({
        mapBanMode: "bo3",
        excludedMaps: ["m1", "m2", "m3"],
      });
      m.start();
      const pool = m.getState().mapBans.mapPool;
      expect(pool).not.toContain("m1");
      expect(pool).not.toContain("m2");
      expect(pool).not.toContain("m3");
      expect(pool).toHaveLength(4);
    });
  });

  describe("character ban phase", () => {
    describe("staggered mode", () => {
      let machine: DraftMachine;

      beforeEach(() => {
        machine = createCharMachine({ banMode: "staggered", numBans: 1 });
        machine.start();
      });

      it("allows blue to ban first", () => {
        const result = machine.banCharacter("blue", "c1");
        expect(result.ok).toBe(true);
        expect(machine.getState().blueTeamBans).toContain("c1");
      });

      it("rejects red banning out of turn", () => {
        const result = machine.banCharacter("red", "c1");
        expect(result.ok).toBe(false);
      });

      it("rejects banning already-banned character", () => {
        machine.banCharacter("blue", "c1");
        const result = machine.banCharacter("red", "c1");
        expect(result.ok).toBe(false);
      });

      it("rejects banning non-existent character", () => {
        const result = machine.banCharacter("blue", "nonexistent");
        expect(result.ok).toBe(false);
      });

      it("transitions to CHAR_PICK after all bans", () => {
        machine.banCharacter("blue", "c1");
        machine.banCharacter("red", "c2");
        expect(machine.getState().phase).toBe("CHAR_PICK");
      });
    });

    describe("simultaneous mode", () => {
      let machine: DraftMachine;

      beforeEach(() => {
        machine = createCharMachine({ banMode: "simultaneous", numBans: 1 });
        machine.start();
      });

      it("accepts ban from either team first", () => {
        const result = machine.banCharacter("blue", "c1");
        expect(result.ok).toBe(true);
      });

      it("does not advance until both submit", () => {
        machine.banCharacter("blue", "c1");
        expect(machine.getState().phase).toBe("CHAR_BAN");
        expect(machine.getState().pendingActions).not.toBeNull();
      });

      it("advances when both teams submit", () => {
        machine.banCharacter("blue", "c1");
        machine.banCharacter("red", "c2");
        expect(machine.getState().pendingActions).toBeNull();
        expect(machine.getState().blueTeamBans).toContain("c1");
        expect(machine.getState().redTeamBans).toContain("c2");
      });

      it("rejects duplicate submission from same team", () => {
        machine.banCharacter("blue", "c1");
        const result = machine.banCharacter("blue", "c2");
        expect(result.ok).toBe(false);
      });

      it("rejects banning the same character the opponent has pending", () => {
        machine.banCharacter("blue", "c1");
        const result = machine.banCharacter("red", "c1");
        expect(result.ok).toBe(false);
      });
    });

    describe("none mode", () => {
      it("skips directly to CHAR_PICK", () => {
        const machine = createCharMachine({ banMode: "none" });
        machine.start();
        expect(machine.getState().phase).toBe("CHAR_PICK");
      });
    });
  });

  describe("character pick phase", () => {
    describe("alternating mode", () => {
      let machine: DraftMachine;

      beforeEach(() => {
        machine = createCharMachine({ draftMode: "alternating", banMode: "none" });
        machine.start();
      });

      it("follows B, R, B, R, B, R order", () => {
        expect(machine.getState().currentTurn).toBe("blue");
        machine.pickCharacter("blue", "c1");
        expect(machine.getState().currentTurn).toBe("red");
        machine.pickCharacter("red", "c2");
        expect(machine.getState().currentTurn).toBe("blue");
      });

      it("rejects out-of-turn picks", () => {
        const result = machine.pickCharacter("red", "c1");
        expect(result.ok).toBe(false);
      });

      it("completes after all picks", () => {
        machine.pickCharacter("blue", "c1");
        machine.pickCharacter("red", "c2");
        machine.pickCharacter("blue", "c3");
        machine.pickCharacter("red", "c4");
        machine.pickCharacter("blue", "c5");
        machine.pickCharacter("red", "c6");
        expect(machine.getState().phase).toBe("COMPLETE");
      });
    });

    describe("snake mode", () => {
      let machine: DraftMachine;

      beforeEach(() => {
        machine = createCharMachine({ draftMode: "snake", banMode: "none" });
        machine.start();
      });

      it("follows B, R, R, B, B, R order", () => {
        expect(machine.getState().currentTurn).toBe("blue");
        machine.pickCharacter("blue", "c1");
        expect(machine.getState().currentTurn).toBe("red");
        machine.pickCharacter("red", "c2");
        expect(machine.getState().currentTurn).toBe("red");
        machine.pickCharacter("red", "c3");
        expect(machine.getState().currentTurn).toBe("blue");
        machine.pickCharacter("blue", "c4");
        expect(machine.getState().currentTurn).toBe("blue");
        machine.pickCharacter("blue", "c5");
        expect(machine.getState().currentTurn).toBe("red");
        machine.pickCharacter("red", "c6");
        expect(machine.getState().phase).toBe("COMPLETE");
      });
    });

    describe("simultaneous mode", () => {
      let machine: DraftMachine;

      beforeEach(() => {
        machine = createCharMachine({
          draftMode: "simultaneous",
          banMode: "none",
          mirrorRule: "full_duplicates",
        });
        machine.start();
      });

      it("accepts picks from either team", () => {
        const result = machine.pickCharacter("blue", "c1");
        expect(result.ok).toBe(true);
      });

      it("does not advance until both submit", () => {
        machine.pickCharacter("blue", "c1");
        expect(machine.getState().phase).toBe("CHAR_PICK");
        expect(machine.getState().pendingActions?.blue).toBe("c1");
      });

      it("hides opponent's pending pick in team view", () => {
        machine.pickCharacter("blue", "c1");
        const redView = machine.getTeamView("red");
        expect(redView.pendingActions?.blue).toBeNull();
        expect(redView.pendingActions?.red).toBeNull();
      });

      it("commits both when both submitted", () => {
        machine.pickCharacter("blue", "c1");
        machine.pickCharacter("red", "c2");
        expect(machine.getState().blueTeamPicks).toContain("c1");
        expect(machine.getState().redTeamPicks).toContain("c2");
      });
    });
  });

  describe("mirror rules", () => {
    it("no_mirrors: rejects picking character already picked by either team", () => {
      const machine = createCharMachine({
        draftMode: "alternating",
        banMode: "none",
        mirrorRule: "no_mirrors",
      });
      machine.start();
      machine.pickCharacter("blue", "c1");
      const result = machine.pickCharacter("red", "c1");
      expect(result.ok).toBe(false);
    });

    it("team_mirrors: allows same character on different teams", () => {
      const machine = createCharMachine({
        draftMode: "alternating",
        banMode: "none",
        mirrorRule: "team_mirrors",
      });
      machine.start();
      machine.pickCharacter("blue", "c1");
      const result = machine.pickCharacter("red", "c1");
      expect(result.ok).toBe(true);
    });

    it("full_duplicates: allows any character anywhere", () => {
      const machine = createCharMachine({
        draftMode: "alternating",
        banMode: "none",
        mirrorRule: "full_duplicates",
      });
      machine.start();
      machine.pickCharacter("blue", "c1");
      const result = machine.pickCharacter("red", "c1");
      expect(result.ok).toBe(true);
    });
  });

  describe("timer expiry", () => {
    it("auto-selects random map on map ban timeout", () => {
      const machine = createMapMachine();
      machine.start();
      const result = machine.expireTimer();
      expect(result.ok).toBe(true);
      expect(machine.getState().mapBans.blueBans).toHaveLength(1);
    });

    it("auto-selects random character on ban timeout", () => {
      const machine = createCharMachine({ banMode: "staggered", numBans: 1 });
      machine.start();
      const result = machine.expireTimer();
      expect(result.ok).toBe(true);
      expect(machine.getState().blueTeamBans).toHaveLength(1);
    });

    it("auto-selects random character on pick timeout", () => {
      const machine = createCharMachine({ banMode: "none" });
      machine.start();
      const result = machine.expireTimer();
      expect(result.ok).toBe(true);
      expect(machine.getState().blueTeamPicks).toHaveLength(1);
    });

    it("auto-fills both teams in simultaneous mode timeout", () => {
      const machine = createCharMachine({
        banMode: "simultaneous",
        numBans: 1,
        mirrorRule: "full_duplicates",
      });
      machine.start();
      const result = machine.expireTimer();
      expect(result.ok).toBe(true);
      expect(machine.getState().blueTeamBans).toHaveLength(1);
      expect(machine.getState().redTeamBans).toHaveLength(1);
    });

    it("auto-fills only the non-submitting team in simultaneous mode", () => {
      const machine = createCharMachine({
        banMode: "simultaneous",
        numBans: 1,
        mirrorRule: "full_duplicates",
      });
      machine.start();
      machine.banCharacter("blue", "c1");
      const result = machine.expireTimer();
      expect(result.ok).toBe(true);
      expect(machine.getState().blueTeamBans).toContain("c1");
      expect(machine.getState().redTeamBans).toHaveLength(1);
    });
  });

  describe("NO_BAN (voluntary skip)", () => {
    it("pushes null into bans in staggered mode and advances", () => {
      const machine = createCharMachine({ banMode: "staggered", numBans: 1 });
      machine.start();
      expect(machine.getState().phase).toBe("CHAR_BAN");

      const result = machine.banCharacter("blue", NO_BAN);
      expect(result.ok).toBe(true);
      expect(machine.getState().blueTeamBans).toEqual([null]);
      // Should advance to red's ban turn
      expect(machine.getState().currentTurn).toBe("red");
    });

    it("pushes null into bans in simultaneous mode and advances", () => {
      const machine = createCharMachine({
        banMode: "simultaneous",
        numBans: 1,
        mirrorRule: "full_duplicates",
      });
      machine.start();
      expect(machine.getState().phase).toBe("CHAR_BAN");

      machine.banCharacter("blue", NO_BAN);
      const result = machine.banCharacter("red", NO_BAN);
      expect(result.ok).toBe(true);
      expect(machine.getState().blueTeamBans).toEqual([null]);
      expect(machine.getState().redTeamBans).toEqual([null]);
      // Should advance past ban phase
      expect(machine.getState().phase).toBe("CHAR_PICK");
    });

    it("does not affect available character pool", () => {
      const machine = createCharMachine({ banMode: "staggered", numBans: 1 });
      machine.start();
      const availableBefore = machine.getAvailableCharacters("blue");

      machine.banCharacter("blue", NO_BAN);
      machine.banCharacter("red", NO_BAN);

      const availableAfter = machine.getAvailableCharacters("blue");
      expect(availableAfter).toEqual(availableBefore);
    });
  });

  describe("completion", () => {
    it("rejects all actions in COMPLETE phase (map draft)", () => {
      const machine = createMapMachine();
      machine.start();
      completeMapPhase(machine);
      expect(machine.getState().phase).toBe("COMPLETE");
      expect(machine.isComplete()).toBe(true);
      expect(machine.banMap("blue", "m1").ok).toBe(false);
    });

    it("rejects all actions in COMPLETE phase (character draft)", () => {
      const machine = createCharMachine({ banMode: "none" });
      machine.start();
      completeCharPicks(machine);
      expect(machine.getState().phase).toBe("COMPLETE");
      expect(machine.isComplete()).toBe(true);
      expect(machine.banCharacter("blue", "c1").ok).toBe(false);
      expect(machine.pickCharacter("blue", "c1").ok).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("skips CHAR_BAN when numBans is 0 with staggered banMode", () => {
      const machine = createCharMachine({ numBans: 0, banMode: "staggered" });
      machine.start();
      expect(machine.getState().phase).toBe("CHAR_PICK");
    });

    it("skips CHAR_BAN when numBans is 0 with simultaneous banMode", () => {
      const machine = createCharMachine({ numBans: 0, banMode: "simultaneous" });
      machine.start();
      expect(machine.getState().phase).toBe("CHAR_PICK");
    });

    it("handles large numBans (5 per team)", () => {
      const machine = createCharMachine({
        numBans: 5,
        banMode: "staggered",
        numPicks: 1,
      });
      machine.start();
      expect(machine.getState().phase).toBe("CHAR_BAN");

      const state = machine.getState();
      const banSteps = state.turnOrder.filter((s) => s.phase === "CHAR_BAN");
      expect(banSteps).toHaveLength(10);

      const available = [...CHARS];
      for (const step of banSteps) {
        const team = step.team as Team;
        const result = machine.banCharacter(team, available.shift()!);
        expect(result.ok).toBe(true);
      }

      const afterBans = machine.getState();
      expect(afterBans.blueTeamBans.filter(Boolean)).toHaveLength(5);
      expect(afterBans.redTeamBans.filter(Boolean)).toHaveLength(5);
      expect(afterBans.phase).toBe("CHAR_PICK");
    });
  });

  describe("full character draft flow - all mode combinations", () => {
    const draftModes: DraftMode[] = ["snake", "alternating", "simultaneous"];
    const banModes: BanMode[] = ["simultaneous", "staggered", "none"];
    const mirrorRules: MirrorRule[] = ["no_mirrors", "team_mirrors", "full_duplicates"];

    for (const draftMode of draftModes) {
      for (const banMode of banModes) {
        for (const mirrorRule of mirrorRules) {
          it(`completes: ${draftMode} + ${banMode} + ${mirrorRule}`, () => {
            const machine = createCharMachine({
              draftMode,
              banMode,
              mirrorRule,
              numBans: 1,
              numPicks: 3,
            });

            machine.start();
            if (banMode !== "none") {
              completeCharBans(machine);
            }
            completeCharPicks(machine);

            expect(machine.getState().phase).toBe("COMPLETE");
            expect(machine.isComplete()).toBe(true);

            const state = machine.getState();
            expect(state.blueTeamPicks).toHaveLength(3);
            expect(state.redTeamPicks).toHaveLength(3);

            if (banMode !== "none") {
              expect(state.blueTeamBans).toHaveLength(1);
              expect(state.redTeamBans).toHaveLength(1);
            }
          });
        }
      }
    }
  });
});
