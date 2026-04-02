import { describe, it, expect, beforeEach } from "vitest";
import { DraftMachine } from "../draft/DraftMachine.js";
import type { DraftConfig, Team, DraftMode, BanMode, MirrorRule } from "../types.js";

// Small rosters for focused testing
const CHARS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10"];
const MAP_IDS = ["m1", "m2", "m3", "m4", "m5", "m6"];
const AWK_IDS = ["a1", "a2", "a3", "a4"];

function makeConfig(overrides: Partial<DraftConfig> = {}): DraftConfig {
  return {
    draftMode: "snake",
    banMode: "simultaneous",
    mirrorRule: "no_mirrors",
    timerSeconds: 30,
    numBans: 1,
    numPicks: 3,
    mapBanMode: "bo1",
    blueMapRole: "side_select",
    excludedMaps: [],
    ...overrides,
  };
}

function createMachine(overrides: Partial<DraftConfig> = {}): DraftMachine {
  return new DraftMachine(makeConfig(overrides), CHARS, MAP_IDS, AWK_IDS);
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

/** Helper: run through awakening reveal steps */
function completeAwakenings(machine: DraftMachine): void {
  const revealed = machine.getState().awakeningReveal.revealedPair!;
  expect(machine.pickAwakening("blue", revealed[0]).ok).toBe(true);
  expect(machine.pickAwakening("red", revealed[1]).ok).toBe(true);
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
      const machine = createMachine();
      expect(machine.getState().phase).toBe("WAITING");
    });

    it("has empty ban and pick arrays", () => {
      const machine = createMachine();
      const state = machine.getState();
      expect(state.blueTeamBans).toEqual([]);
      expect(state.redTeamBans).toEqual([]);
      expect(state.blueTeamPicks).toEqual([]);
      expect(state.redTeamPicks).toEqual([]);
    });

    it("has generated turn order", () => {
      const machine = createMachine();
      expect(machine.getState().turnOrder.length).toBeGreaterThan(0);
    });
  });

  describe("start", () => {
    it("transitions from WAITING to first phase", () => {
      const machine = createMachine();
      const result = machine.start();
      expect(result.ok).toBe(true);
      expect(machine.getState().phase).toBe("MAP_BAN");
    });

    it("reveals an awakening pair", () => {
      const machine = createMachine();
      machine.start();
      const pair = machine.getState().awakeningReveal.revealedPair;
      expect(pair).not.toBeNull();
      expect(pair).toHaveLength(2);
      expect(AWK_IDS).toContain(pair![0]);
      expect(AWK_IDS).toContain(pair![1]);
    });

    it("rejects start when already started", () => {
      const machine = createMachine();
      machine.start();
      const result = machine.start();
      expect(result.ok).toBe(false);
    });
  });

  describe("map phase - Bo1", () => {
    let machine: DraftMachine;

    beforeEach(() => {
      // Bo1 default: blue = side_select, red = map_select
      // Flow: blue ban, blue ban, blue ban, red pick
      machine = createMachine();
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

    it("transitions to AWAKENING_REVEAL after map phase completes", () => {
      completeMapPhase(machine);
      expect(machine.getState().phase).toBe("AWAKENING_REVEAL");
    });
  });

  describe("awakening reveal phase", () => {
    let machine: DraftMachine;

    beforeEach(() => {
      machine = createMachine();
      machine.start();
      completeMapPhase(machine);
    });

    it("allows blue to pick a revealed awakening", () => {
      const revealed = machine.getState().awakeningReveal.revealedPair!;
      const result = machine.pickAwakening("blue", revealed[0]);
      expect(result.ok).toBe(true);
      expect(machine.getState().awakeningReveal.blueChoice).toBe(revealed[0]);
    });

    it("rejects picking an unrevealed awakening", () => {
      const revealed = machine.getState().awakeningReveal.revealedPair!;
      const unrevealed = AWK_IDS.find((id) => !revealed.includes(id))!;
      const result = machine.pickAwakening("blue", unrevealed);
      expect(result.ok).toBe(false);
    });

    it("rejects red picking before blue", () => {
      const revealed = machine.getState().awakeningReveal.revealedPair!;
      const result = machine.pickAwakening("red", revealed[0]);
      expect(result.ok).toBe(false);
    });

    it("gives red the other awakening if red picks the same as blue", () => {
      const revealed = machine.getState().awakeningReveal.revealedPair!;
      machine.pickAwakening("blue", revealed[0]);
      // Red tries to pick the same one blue chose
      const result = machine.pickAwakening("red", revealed[0]);
      expect(result.ok).toBe(true);
      // Red should get the alternative
      expect(machine.getState().awakeningReveal.redChoice).toBe(revealed[1]);
    });

    it("transitions to CHAR_BAN after both teams pick", () => {
      completeAwakenings(machine);
      expect(machine.getState().phase).toBe("CHAR_BAN");
    });
  });

  describe("no awakenings", () => {
    it("skips AWAKENING_REVEAL when no awakenings provided", () => {
      const machine = new DraftMachine(
        makeConfig({ banMode: "none" }),
        CHARS,
        MAP_IDS,
        [], // no awakenings
      );
      machine.start();
      completeMapPhase(machine);
      // Should skip straight to CHAR_PICK
      expect(machine.getState().phase).toBe("CHAR_PICK");
    });
  });

  describe("character ban phase", () => {
    describe("staggered mode", () => {
      let machine: DraftMachine;

      beforeEach(() => {
        machine = createMachine({ banMode: "staggered", numBans: 1 });
        machine.start();
        completeMapPhase(machine);
        completeAwakenings(machine);
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
        machine = createMachine({ banMode: "simultaneous", numBans: 1 });
        machine.start();
        completeMapPhase(machine);
        completeAwakenings(machine);
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
        // Should have moved past CHAR_BAN
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
        const machine = createMachine({ banMode: "none" });
        machine.start();
        completeMapPhase(machine);
        completeAwakenings(machine);
        expect(machine.getState().phase).toBe("CHAR_PICK");
      });
    });
  });

  describe("character pick phase", () => {
    describe("alternating mode", () => {
      let machine: DraftMachine;

      beforeEach(() => {
        machine = createMachine({ draftMode: "alternating", banMode: "none" });
        machine.start();
        completeMapPhase(machine);
        completeAwakenings(machine);
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
        machine = createMachine({ draftMode: "snake", banMode: "none" });
        machine.start();
        completeMapPhase(machine);
        completeAwakenings(machine);
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
        machine = createMachine({
          draftMode: "simultaneous",
          banMode: "none",
          mirrorRule: "full_duplicates",
        });
        machine.start();
        completeMapPhase(machine);
        completeAwakenings(machine);
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
      const machine = createMachine({
        draftMode: "alternating",
        banMode: "none",
        mirrorRule: "no_mirrors",
      });
      machine.start();
      completeMapPhase(machine);
      completeAwakenings(machine);
      machine.pickCharacter("blue", "c1");
      // Red cannot pick c1
      const result = machine.pickCharacter("red", "c1");
      expect(result.ok).toBe(false);
    });

    it("team_mirrors: allows same character on different teams", () => {
      const machine = createMachine({
        draftMode: "alternating",
        banMode: "none",
        mirrorRule: "team_mirrors",
      });
      machine.start();
      completeMapPhase(machine);
      completeAwakenings(machine);
      machine.pickCharacter("blue", "c1");
      // Red CAN pick c1
      const result = machine.pickCharacter("red", "c1");
      expect(result.ok).toBe(true);
    });

    it("full_duplicates: allows any character anywhere", () => {
      const machine = createMachine({
        draftMode: "alternating",
        banMode: "none",
        mirrorRule: "full_duplicates",
      });
      machine.start();
      completeMapPhase(machine);
      completeAwakenings(machine);
      machine.pickCharacter("blue", "c1");
      const result = machine.pickCharacter("red", "c1");
      expect(result.ok).toBe(true);
    });
  });

  describe("timer expiry", () => {
    it("auto-selects random map on map ban timeout", () => {
      const machine = createMachine();
      machine.start();
      const result = machine.expireTimer();
      expect(result.ok).toBe(true);
      expect(machine.getState().mapBans.blueBans).toHaveLength(1);
    });

    it("auto-selects random character on ban timeout", () => {
      const machine = createMachine({ banMode: "staggered", numBans: 1 });
      machine.start();
      completeMapPhase(machine);
      completeAwakenings(machine);
      const result = machine.expireTimer();
      expect(result.ok).toBe(true);
      expect(machine.getState().blueTeamBans).toHaveLength(1);
    });

    it("auto-selects random character on pick timeout", () => {
      const machine = createMachine({ banMode: "none" });
      machine.start();
      completeMapPhase(machine);
      completeAwakenings(machine);
      const result = machine.expireTimer();
      expect(result.ok).toBe(true);
      expect(machine.getState().blueTeamPicks).toHaveLength(1);
    });

    it("auto-fills both teams in simultaneous mode timeout", () => {
      const machine = createMachine({
        banMode: "simultaneous",
        numBans: 1,
        mirrorRule: "full_duplicates",
      });
      machine.start();
      completeMapPhase(machine);
      completeAwakenings(machine);
      // Neither team submits, timer expires
      const result = machine.expireTimer();
      expect(result.ok).toBe(true);
      expect(machine.getState().blueTeamBans).toHaveLength(1);
      expect(machine.getState().redTeamBans).toHaveLength(1);
    });

    it("auto-fills only the non-submitting team in simultaneous mode", () => {
      const machine = createMachine({
        banMode: "simultaneous",
        numBans: 1,
        mirrorRule: "full_duplicates",
      });
      machine.start();
      completeMapPhase(machine);
      completeAwakenings(machine);
      // Blue submits, red doesn't
      machine.banCharacter("blue", "c1");
      const result = machine.expireTimer();
      expect(result.ok).toBe(true);
      expect(machine.getState().blueTeamBans).toContain("c1");
      expect(machine.getState().redTeamBans).toHaveLength(1);
    });
  });

  describe("completion", () => {
    it("rejects all actions in COMPLETE phase", () => {
      const machine = createMachine({ banMode: "none" });
      machine.start();
      completeMapPhase(machine);
      completeAwakenings(machine);
      completeCharPicks(machine);
      expect(machine.getState().phase).toBe("COMPLETE");
      expect(machine.isComplete()).toBe(true);

      expect(machine.banMap("blue", "m1").ok).toBe(false);
      expect(machine.banCharacter("blue", "c1").ok).toBe(false);
      expect(machine.pickCharacter("blue", "c1").ok).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("auto-selects awakening on timer expiry during AWAKENING_REVEAL", () => {
      const machine = createMachine();
      machine.start();
      completeMapPhase(machine);
      // Timer expires for blue during awakening
      const result = machine.expireTimer();
      expect(result.ok).toBe(true);
      // Blue should have a choice auto-assigned
      expect(machine.getState().awakeningReveal.blueChoice).toBeTruthy();
    });

    it("skips CHAR_BAN when numBans is 0 with staggered banMode", () => {
      const machine = createMachine({ numBans: 0, banMode: "staggered" });
      machine.start();
      completeMapPhase(machine);
      completeAwakenings(machine);
      // Should jump to CHAR_PICK, skipping CHAR_BAN
      expect(machine.getState().phase).toBe("CHAR_PICK");
    });

    it("skips CHAR_BAN when numBans is 0 with simultaneous banMode", () => {
      const machine = createMachine({ numBans: 0, banMode: "simultaneous" });
      machine.start();
      completeMapPhase(machine);
      completeAwakenings(machine);
      expect(machine.getState().phase).toBe("CHAR_PICK");
    });

    it("handles large numBans (5 per team)", () => {
      const machine = createMachine({
        numBans: 5,
        banMode: "staggered",
        numPicks: 1,
      });
      machine.start();
      completeMapPhase(machine);
      completeAwakenings(machine);

      expect(machine.getState().phase).toBe("CHAR_BAN");

      // Complete all 10 ban steps (5 per team, staggered)
      const state = machine.getState();
      const banSteps = state.turnOrder.filter((s) => s.phase === "CHAR_BAN");
      expect(banSteps).toHaveLength(10);

      const available = [...CHARS];
      for (const step of banSteps) {
        const team = step.team as Team;
        const result = machine.banCharacter(team, available.shift()!);
        expect(result.ok).toBe(true);
      }

      // All 10 bans should be filled before picks
      const afterBans = machine.getState();
      expect(afterBans.blueTeamBans.filter(Boolean)).toHaveLength(5);
      expect(afterBans.redTeamBans.filter(Boolean)).toHaveLength(5);
      expect(afterBans.phase).toBe("CHAR_PICK");
    });

    it("filters excluded maps from the pool", () => {
      const machine = createMachine({
        mapBanMode: "bo3",
        blueMapRole: "side_select",
        excludedMaps: ["m1", "m2", "m3"],
      });
      machine.start();
      const pool = machine.getState().mapBans.mapPool;
      expect(pool).not.toContain("m1");
      expect(pool).not.toContain("m2");
      expect(pool).not.toContain("m3");
      expect(pool).toHaveLength(3);
    });
  });

  describe("full draft flow - all mode combinations", () => {
    const draftModes: DraftMode[] = ["snake", "alternating", "simultaneous"];
    const banModes: BanMode[] = ["simultaneous", "staggered", "none"];
    const mirrorRules: MirrorRule[] = ["no_mirrors", "team_mirrors", "full_duplicates"];

    for (const draftMode of draftModes) {
      for (const banMode of banModes) {
        for (const mirrorRule of mirrorRules) {
          it(`completes: ${draftMode} + ${banMode} + ${mirrorRule}`, () => {
            const machine = createMachine({
              draftMode,
              banMode,
              mirrorRule,
              numBans: 1,
              numPicks: 3,
            });

            machine.start();
            completeMapPhase(machine);
            completeAwakenings(machine);
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
