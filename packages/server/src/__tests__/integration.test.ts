import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import type { DraftConfig, DraftState, RoomState } from "@os-drafter/shared";
import { CHARACTERS, MAPS, NO_BAN, CURRENT_AWAKENING_POOL, AWAKENING_EXCLUSIONS } from "@os-drafter/shared";
import {
  createTestServer,
  createTestClient,
  waitForEvent,
  waitForConnect,
  delay,
  type TestServer,
  type TestSocket,
} from "./helpers.js";
import { registry } from "../RoomRegistry.js";

// Shrink the empty-room grace period so cleanup assertions don't wait 30s.
registry.setGraceMs(50);

// ── Shared test fixtures ──

const activeMaps = MAPS.filter((m) => m.active);

const MAP_CONFIG: DraftConfig = {
  draftType: "map",
  draftMode: "snake",
  banMode: "simultaneous",
  mirrorRule: "no_mirrors",
  timerSeconds: 30,
  numBans: 0,
  numPicks: 1,
  mapBanMode: "bo1",
  blueMapRole: "side_select",
  excludedMaps: activeMaps.slice(0, 3).map((m) => m.id),
};

const CHAR_CONFIG: DraftConfig = {
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
  selectedMapName: "Test Map",
};

// Maps that are in the pool after exclusion (first 3 active maps are excluded)
const poolMaps = activeMaps.slice(3);
const characterIds = CHARACTERS.map((c) => c.id);

// ── Helpers ──

/** Wait for a draft:state event and return the DraftState */
async function waitForDraftState(socket: TestSocket): Promise<DraftState> {
  const [state] = await waitForEvent(socket, "draft:state");
  return state;
}

/** Wait for a room:state event and return the RoomState */
async function waitForRoomState(socket: TestSocket): Promise<RoomState> {
  const [state] = await waitForEvent(socket, "room:state");
  return state;
}

/** Wait for an error event and return the error message */
async function waitForError(socket: TestSocket): Promise<string> {
  const [msg] = await waitForEvent(socket, "error");
  return msg;
}

/** Create a room with blue client and return the roomId */
async function createRoom(
  blue: TestSocket,
  config: DraftConfig = MAP_CONFIG,
): Promise<string> {
  const stateP = waitForEvent(blue, "room:state");
  const roomId = await new Promise<string>((resolve) => {
    blue.emit("room:create", config, (id: string) => resolve(id));
  });
  await stateP;
  return roomId;
}

/** Join red to an existing room and wait for state updates */
async function joinRed(red: TestSocket, roomId: string): Promise<void> {
  const redStateP = waitForEvent(red, "room:state");
  red.emit("room:join", roomId, "red");
  await redStateP;
  await delay(50);
}

/** Start draft and wait for both clients to receive draft:state */
async function startDraft(
  blue: TestSocket,
  red: TestSocket,
): Promise<{ blueState: DraftState; redState: DraftState }> {
  const blueP = waitForDraftState(blue);
  const redP = waitForDraftState(red);
  blue.emit("draft:start");
  const [blueState, redState] = await Promise.all([blueP, redP]);
  return { blueState, redState };
}

/**
 * Drive a full map draft to COMPLETE.
 */
async function runFullMapDraft(
  blue: TestSocket,
  red: TestSocket,
  config: DraftConfig = MAP_CONFIG,
): Promise<DraftState> {
  const roomId = await createRoom(blue, config);
  await joinRed(red, roomId);
  const { blueState } = await startDraft(blue, red);

  let state = blueState;
  const turnOrder = state.turnOrder;

  for (let i = state.turnIndex; i < turnOrder.length; i++) {
    const step = turnOrder[i];
    const socket = step.team === "blue" ? blue : step.team === "red" ? red : null;

    const available = state.mapBans.mapPool.filter(
      (id: string) =>
        !state.mapBans.blueBans.includes(id) &&
        !state.mapBans.redBans.includes(id) &&
        !state.mapBans.bluePicks.includes(id) &&
        !state.mapBans.redPicks.includes(id),
    );

    const p = waitForDraftState(blue);
    if (step.type === "map_pick") {
      socket!.emit("draft:pick-map", available[0]);
    } else {
      socket!.emit("draft:ban-map", available[0]);
    }
    state = await p;

    if (state.phase === "COMPLETE") break;
  }

  return state;
}

/**
 * Drive a full character draft to COMPLETE.
 */
async function runFullCharDraft(
  blue: TestSocket,
  red: TestSocket,
  config: DraftConfig = CHAR_CONFIG,
): Promise<DraftState> {
  const roomId = await createRoom(blue, config);
  await joinRed(red, roomId);
  const { blueState } = await startDraft(blue, red);

  let state = blueState;
  const turnOrder = state.turnOrder;

  for (let i = state.turnIndex; i < turnOrder.length; i++) {
    const step = turnOrder[i];

    if (step.type === "ban" || step.type === "pick") {
      const allBanned = [...state.blueTeamBans, ...state.redTeamBans].filter(Boolean) as string[];
      const allPicked = [...state.blueTeamPicks, ...state.redTeamPicks].filter(Boolean) as string[];
      const used = new Set([...allBanned, ...allPicked]);
      const available = characterIds.filter((id) => !used.has(id));

      if (step.team === "both") {
        const p1 = waitForDraftState(blue);
        blue.emit("draft:select", available[0]);
        blue.emit("draft:lock");
        await p1;
        const p2 = waitForDraftState(blue);
        red.emit("draft:select", available[1]);
        red.emit("draft:lock");
        state = await p2;
      } else {
        const socket = step.team === "blue" ? blue : red;
        const p = waitForDraftState(blue);
        socket.emit("draft:select", available[0]);
        socket.emit("draft:lock");
        state = await p;
      }
    }

    if (state.phase === "COMPLETE") break;
  }

  return state;
}

// ════════════════════════════════════════════════════
// Suite A: Room Management
// ════════════════════════════════════════════════════

describe("Room Management", () => {
  let server: TestServer;
  const sockets: TestSocket[] = [];

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterEach(async () => {
    for (const s of sockets) {
      if (s.connected) s.disconnect();
    }
    sockets.length = 0;
    await delay(100);
  });

  afterAll(async () => {
    await server.close();
  });

  function client(): TestSocket {
    const s = createTestClient(server.url);
    sockets.push(s);
    return s;
  }

  it("should create a room and auto-join creator as blue", async () => {
    const blue = client();
    await waitForConnect(blue);

    const roomId = await createRoom(blue);
    expect(roomId).toBeTruthy();
    expect(typeof roomId).toBe("string");

    const room = registry.get(roomId);
    expect(room).toBeDefined();
    expect(room!.isBlueConnected()).toBe(true);
    expect(room!.isRedConnected()).toBe(false);
  });

  it("should allow red to join and update room state for both", async () => {
    const blue = client();
    const red = client();
    await Promise.all([waitForConnect(blue), waitForConnect(red)]);

    const roomId = await createRoom(blue);

    const blueStateP = waitForRoomState(blue);
    const redStateP = waitForRoomState(red);
    red.emit("room:join", roomId, "red");
    const [blueRoomState, redRoomState] = await Promise.all([blueStateP, redStateP]);

    expect(blueRoomState.blueConnected).toBe(true);
    expect(blueRoomState.redConnected).toBe(true);
    expect(redRoomState.blueConnected).toBe(true);
    expect(redRoomState.redConnected).toBe(true);
  });

  it("should track spectator count", async () => {
    const blue = client();
    const spec = client();
    await Promise.all([waitForConnect(blue), waitForConnect(spec)]);

    const roomId = await createRoom(blue);

    const blueStateP = waitForRoomState(blue);
    spec.emit("room:join", roomId, "spectator");
    const state = await blueStateP;

    expect(state.spectatorCount).toBe(1);
  });

  it("should reject duplicate team assignment", async () => {
    const blue = client();
    const blue2 = client();
    await Promise.all([waitForConnect(blue), waitForConnect(blue2)]);

    const roomId = await createRoom(blue);

    const errorP = waitForError(blue2);
    blue2.emit("room:join", roomId, "blue");
    const errorMsg = await errorP;

    expect(errorMsg).toContain("Blue team is already taken");
  });

  it("should emit error when joining non-existent room", async () => {
    const s = client();
    await waitForConnect(s);

    const errorP = waitForError(s);
    s.emit("room:join", "nonexistent", "blue");
    const errorMsg = await errorP;

    expect(errorMsg).toContain("not found");
  });

  it("should clean up room when all sockets disconnect", async () => {
    const blue = client();
    await waitForConnect(blue);

    const roomId = await createRoom(blue);
    expect(registry.get(roomId)).toBeDefined();

    blue.disconnect();
    // Wait past the (shortened) empty-room grace period before asserting cleanup.
    await delay(200);

    expect(registry.get(roomId)).toBeUndefined();
  });
});

// ════════════════════════════════════════════════════
// Suite B: Full Draft Flow
// ════════════════════════════════════════════════════

describe("Full Draft Flow", () => {
  let server: TestServer;
  const sockets: TestSocket[] = [];

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterEach(async () => {
    for (const s of sockets) {
      if (s.connected) s.disconnect();
    }
    sockets.length = 0;
    await delay(100);
  });

  afterAll(async () => {
    await server.close();
  });

  function client(): TestSocket {
    const s = createTestClient(server.url);
    sockets.push(s);
    return s;
  }

  it("should complete a full map draft (Bo1)", async () => {
    const blue = client();
    const red = client();
    await Promise.all([waitForConnect(blue), waitForConnect(red)]);

    const state = await runFullMapDraft(blue, red);

    expect(state.phase).toBe("COMPLETE");
    expect(state.mapBans.selectedMap).toBeTruthy();
  }, 10000);

  it("should complete a full character draft with alternating + staggered + no_mirrors", async () => {
    const blue = client();
    const red = client();
    await Promise.all([waitForConnect(blue), waitForConnect(red)]);

    const state = await runFullCharDraft(blue, red, {
      ...CHAR_CONFIG,
      draftMode: "alternating",
      banMode: "staggered",
      mirrorRule: "no_mirrors",
    });

    expect(state.phase).toBe("COMPLETE");
    expect(state.blueTeamBans.filter(Boolean)).toHaveLength(CHAR_CONFIG.numBans);
    expect(state.redTeamBans.filter(Boolean)).toHaveLength(CHAR_CONFIG.numBans);
    expect(state.blueTeamPicks.filter(Boolean)).toHaveLength(CHAR_CONFIG.numPicks);
    expect(state.redTeamPicks.filter(Boolean)).toHaveLength(CHAR_CONFIG.numPicks);
  }, 10000);

  it("should complete a full character draft with snake + simultaneous bans + no_mirrors", async () => {
    const blue = client();
    const red = client();
    await Promise.all([waitForConnect(blue), waitForConnect(red)]);

    const state = await runFullCharDraft(blue, red, {
      ...CHAR_CONFIG,
      draftMode: "snake",
      banMode: "simultaneous",
      mirrorRule: "no_mirrors",
    });

    expect(state.phase).toBe("COMPLETE");
    expect(state.blueTeamPicks.filter(Boolean)).toHaveLength(CHAR_CONFIG.numPicks);
    expect(state.redTeamPicks.filter(Boolean)).toHaveLength(CHAR_CONFIG.numPicks);
  }, 10000);

  it("should complete a character draft with no bans", async () => {
    const blue = client();
    const red = client();
    await Promise.all([waitForConnect(blue), waitForConnect(red)]);

    const state = await runFullCharDraft(blue, red, {
      ...CHAR_CONFIG,
      banMode: "none",
      numBans: 0,
    });

    expect(state.phase).toBe("COMPLETE");
    expect(state.blueTeamPicks.filter(Boolean)).toHaveLength(CHAR_CONFIG.numPicks);
  }, 10000);

  it("should broadcast draft:action events during the draft", async () => {
    const blue = client();
    const red = client();
    await Promise.all([waitForConnect(blue), waitForConnect(red)]);

    const roomId = await createRoom(blue);
    await joinRed(red, roomId);
    await startDraft(blue, red);

    // Blue bans a map - red should receive the action
    const actionP = waitForEvent(red, "draft:action");
    blue.emit("draft:ban-map", poolMaps[0].id);
    const [action] = await actionP;

    expect(action.type).toBe("map_ban");
    expect(action.team).toBe("blue");
  });

  it("should broadcast phase changes", async () => {
    const blue = client();
    const red = client();
    await Promise.all([waitForConnect(blue), waitForConnect(red)]);

    const roomId = await createRoom(blue, MAP_CONFIG);
    await joinRed(red, roomId);

    const phaseP = waitForEvent(blue, "draft:phase-change");
    blue.emit("draft:start");
    const [phase] = await phaseP;
    expect(phase).toBe("MAP_BAN");
  });
});

// ════════════════════════════════════════════════════
// Suite C: Disconnection & Reconnection
// ════════════════════════════════════════════════════

describe("Disconnection & Reconnection", () => {
  let server: TestServer;
  const sockets: TestSocket[] = [];

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterEach(async () => {
    for (const s of sockets) {
      if (s.connected) s.disconnect();
    }
    sockets.length = 0;
    await delay(100);
  });

  afterAll(async () => {
    await server.close();
  });

  function client(): TestSocket {
    const s = createTestClient(server.url);
    sockets.push(s);
    return s;
  }

  it("should notify remaining player when opponent disconnects", async () => {
    const blue = client();
    const red = client();
    await Promise.all([waitForConnect(blue), waitForConnect(red)]);

    const roomId = await createRoom(blue);
    await joinRed(red, roomId);
    await startDraft(blue, red);

    const redRoomP = waitForRoomState(red);
    blue.disconnect();
    const roomState = await redRoomP;

    expect(roomState.blueConnected).toBe(false);
    expect(roomState.redConnected).toBe(true);
    expect(roomState.draft).not.toBeNull();
  });

  it("should allow reconnection with state catch-up", async () => {
    const blue = client();
    const red = client();
    await Promise.all([waitForConnect(blue), waitForConnect(red)]);

    const roomId = await createRoom(blue);
    await joinRed(red, roomId);
    await startDraft(blue, red);

    // Do a map ban before disconnect
    const blueStateP = waitForDraftState(blue);
    blue.emit("draft:ban-map", poolMaps[0].id);
    await blueStateP;

    // Blue disconnects
    blue.disconnect();
    await delay(200);

    // New blue socket reconnects
    const blue2 = client();
    await waitForConnect(blue2);

    const draftStateP = waitForDraftState(blue2);
    blue2.emit("room:join", roomId, "blue");
    const catchUpState = await draftStateP;

    expect(catchUpState.mapBans.blueBans).toContain(poolMaps[0].id);
  });

  it("should clean up room when all participants disconnect", async () => {
    const blue = client();
    const red = client();
    await Promise.all([waitForConnect(blue), waitForConnect(red)]);

    const roomId = await createRoom(blue);
    await joinRed(red, roomId);

    blue.disconnect();
    await delay(100);
    red.disconnect();
    await delay(200);

    expect(registry.get(roomId)).toBeUndefined();
  });
});

// ════════════════════════════════════════════════════
// Suite D: Timer Expiry & Auto-Selection
// ════════════════════════════════════════════════════

describe("Timer Expiry", () => {
  let server: TestServer;
  const sockets: TestSocket[] = [];

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterEach(async () => {
    for (const s of sockets) {
      if (s.connected) s.disconnect();
    }
    sockets.length = 0;
    await delay(100);
  });

  afterAll(async () => {
    await server.close();
  });

  function client(): TestSocket {
    const s = createTestClient(server.url);
    sockets.push(s);
    return s;
  }

  it("should auto-select on timer expiry and advance the draft", async () => {
    const blue = client();
    const red = client();
    await Promise.all([waitForConnect(blue), waitForConnect(red)]);

    const roomId = await createRoom(blue, { ...MAP_CONFIG, timerSeconds: 1 });
    await joinRed(red, roomId);
    await startDraft(blue, red);

    // Wait for timer expiry to auto-select (MAP_BAN phase, blue's turn)
    const state = await waitForDraftState(blue);
    expect(state.mapBans.blueBans.length).toBe(1);
  }, 10000);

  it("should emit draft:timer ticks", async () => {
    const blue = client();
    const red = client();
    await Promise.all([waitForConnect(blue), waitForConnect(red)]);

    const roomId = await createRoom(blue, { ...MAP_CONFIG, timerSeconds: 2 });
    await joinRed(red, roomId);
    await startDraft(blue, red);

    const [remaining] = await waitForEvent(blue, "draft:timer", 3000);
    expect(typeof remaining).toBe("number");
    expect(remaining).toBeLessThanOrEqual(2);
  }, 10000);
});

// ════════════════════════════════════════════════════
// Suite E: Simultaneous Mode Edge Cases
// ════════════════════════════════════════════════════

describe("Simultaneous Mode", () => {
  let server: TestServer;
  const sockets: TestSocket[] = [];

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterEach(async () => {
    for (const s of sockets) {
      if (s.connected) s.disconnect();
    }
    sockets.length = 0;
    await delay(100);
  });

  afterAll(async () => {
    await server.close();
  });

  function client(): TestSocket {
    const s = createTestClient(server.url);
    sockets.push(s);
    return s;
  }

  it("should handle simultaneous bans correctly", async () => {
    const blue = client();
    const red = client();
    await Promise.all([waitForConnect(blue), waitForConnect(red)]);

    const config: DraftConfig = {
      ...CHAR_CONFIG,
      banMode: "simultaneous",
    };

    const roomId = await createRoom(blue, config);
    await joinRed(red, roomId);

    const { blueState } = await startDraft(blue, red);
    let state = blueState;

    // Should start in CHAR_BAN with simultaneous bans
    if (state.phase === "CHAR_BAN") {
      const step = state.turnOrder[state.turnIndex];
      expect(step.team).toBe("both");

      // Blue submits first
      let p = waitForDraftState(blue);
      blue.emit("draft:select", characterIds[0]);
      blue.emit("draft:lock");
      await p; // pending state

      // Red submits second — triggers commit
      p = waitForDraftState(blue);
      red.emit("draft:select", characterIds[1]);
      red.emit("draft:lock");
      state = await p; // committed state

      const totalBans = [
        ...state.blueTeamBans.filter(Boolean),
        ...state.redTeamBans.filter(Boolean),
      ];
      expect(totalBans.length).toBeGreaterThanOrEqual(2);
    }
  }, 10000);

  it("should reject lock without prior selection", async () => {
    const blue = client();
    const red = client();
    await Promise.all([waitForConnect(blue), waitForConnect(red)]);

    const roomId = await createRoom(blue, CHAR_CONFIG);
    await joinRed(red, roomId);
    await startDraft(blue, red);

    // Now in CHAR_BAN - try locking without selection
    const errorP = waitForError(blue);
    blue.emit("draft:lock");
    const errorMsg = await errorP;
    expect(errorMsg).toContain("No character selected");
  }, 10000);
});

// ════════════════════════════════════════════════════
// Suite F: Validation & Errors
// ════════════════════════════════════════════════════

describe("Validation & Errors", () => {
  let server: TestServer;
  const sockets: TestSocket[] = [];

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterEach(async () => {
    for (const s of sockets) {
      if (s.connected) s.disconnect();
    }
    sockets.length = 0;
    await delay(100);
  });

  afterAll(async () => {
    await server.close();
  });

  function client(): TestSocket {
    const s = createTestClient(server.url);
    sockets.push(s);
    return s;
  }

  it("should reject draft:start when only one team is connected", async () => {
    const blue = client();
    await waitForConnect(blue);

    await createRoom(blue);

    const errorP = waitForError(blue);
    blue.emit("draft:start");
    const msg = await errorP;
    expect(msg).toContain("Both teams must be connected");
  });

  it("should reject draft:start from spectator", async () => {
    const blue = client();
    const red = client();
    const spec = client();
    await Promise.all([
      waitForConnect(blue),
      waitForConnect(red),
      waitForConnect(spec),
    ]);

    const roomId = await createRoom(blue);
    await joinRed(red, roomId);

    const specStateP = waitForRoomState(spec);
    spec.emit("room:join", roomId, "spectator");
    await specStateP;

    const errorP = waitForError(spec);
    spec.emit("draft:start");
    const msg = await errorP;
    expect(msg).toContain("Only team members");
  });

  it("should reject actions from spectators", async () => {
    const blue = client();
    const red = client();
    const spec = client();
    await Promise.all([
      waitForConnect(blue),
      waitForConnect(red),
      waitForConnect(spec),
    ]);

    const roomId = await createRoom(blue);
    await joinRed(red, roomId);

    const specStateP = waitForRoomState(spec);
    spec.emit("room:join", roomId, "spectator");
    await specStateP;

    await startDraft(blue, red);

    const errorP = waitForError(spec);
    spec.emit("draft:ban-map", poolMaps[0].id);
    const msg = await errorP;
    expect(msg).toContain("Spectators");
  });

  it("should reject starting draft twice", async () => {
    const blue = client();
    const red = client();
    await Promise.all([waitForConnect(blue), waitForConnect(red)]);

    const roomId = await createRoom(blue);
    await joinRed(red, roomId);
    await startDraft(blue, red);

    const errorP = waitForError(blue);
    blue.emit("draft:start");
    const msg = await errorP;
    expect(msg).toContain("already");
  });
});

// ════════════════════════════════════════════════════
// Suite G: REST API Tests
// ════════════════════════════════════════════════════

describe("REST API", () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it("POST /rooms should create a room and return URLs including overlay", async () => {
    const response = await server.app.inject({
      method: "POST",
      url: "/rooms",
      headers: { "content-type": "application/json" },
      payload: MAP_CONFIG,
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.roomId).toBeTruthy();
    expect(body.blueUrl).toContain(body.roomId);
    expect(body.redUrl).toContain(body.roomId);
    expect(body.spectatorUrl).toContain(body.roomId);
    expect(body.overlayUrl).toContain(body.roomId);
    expect(body.overlayUrl).toContain("/overlay");
  });

  it("POST /rooms should reject invalid config", async () => {
    const response = await server.app.inject({
      method: "POST",
      url: "/rooms",
      headers: { "content-type": "application/json" },
      payload: { draftMode: "invalid" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("GET /rooms/:id should return room state", async () => {
    const createRes = await server.app.inject({
      method: "POST",
      url: "/rooms",
      headers: { "content-type": "application/json" },
      payload: MAP_CONFIG,
    });
    const { roomId } = JSON.parse(createRes.body);

    const response = await server.app.inject({
      method: "GET",
      url: `/rooms/${roomId}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body) as RoomState;
    expect(body.roomId).toBe(roomId);
    expect(body.config).toEqual(MAP_CONFIG);
  });

  it("GET /rooms/:id should return 404 for non-existent room", async () => {
    const response = await server.app.inject({
      method: "GET",
      url: "/rooms/nonexistent",
    });

    expect(response.statusCode).toBe(404);
  });

  it("POST /rooms with team names should persist them in room state", async () => {
    const createRes = await server.app.inject({
      method: "POST",
      url: "/rooms",
      headers: { "content-type": "application/json" },
      payload: { ...MAP_CONFIG, blueTeamName: "BOIS", redTeamName: "CALM" },
    });

    expect(createRes.statusCode).toBe(201);
    const { roomId } = JSON.parse(createRes.body);

    const getRes = await server.app.inject({
      method: "GET",
      url: `/rooms/${roomId}`,
    });

    const state = JSON.parse(getRes.body) as RoomState;
    expect(state.blueTeamName).toBe("BOIS");
    expect(state.redTeamName).toBe("CALM");
  });

  it("POST /rooms should normalize team names (trim + uppercase)", async () => {
    const createRes = await server.app.inject({
      method: "POST",
      url: "/rooms",
      headers: { "content-type": "application/json" },
      payload: { ...MAP_CONFIG, blueTeamName: " ab ", redTeamName: "cd" },
    });

    expect(createRes.statusCode).toBe(201);
    const { roomId } = JSON.parse(createRes.body);

    const getRes = await server.app.inject({
      method: "GET",
      url: `/rooms/${roomId}`,
    });

    const state = JSON.parse(getRes.body) as RoomState;
    expect(state.blueTeamName).toBe("AB");
    expect(state.redTeamName).toBe("CD");
  });

  it("POST /rooms should omit team names when whitespace-only", async () => {
    const createRes = await server.app.inject({
      method: "POST",
      url: "/rooms",
      headers: { "content-type": "application/json" },
      payload: { ...MAP_CONFIG, blueTeamName: "   " },
    });

    expect(createRes.statusCode).toBe(201);
    const { roomId } = JSON.parse(createRes.body);

    const getRes = await server.app.inject({
      method: "GET",
      url: `/rooms/${roomId}`,
    });

    const state = JSON.parse(getRes.body) as RoomState;
    expect(state.blueTeamName).toBeUndefined();
  });

  it("POST /rooms should reject team names longer than 4 chars", async () => {
    const response = await server.app.inject({
      method: "POST",
      url: "/rooms",
      headers: { "content-type": "application/json" },
      payload: { ...MAP_CONFIG, blueTeamName: "ABCDE" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("GET /health should return ok", async () => {
    const response = await server.app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).status).toBe("ok");
  });
});

// ════════════════════════════════════════════════════
// Suite G: Character Phase Timer Expiry with Tentative Selections
// ════════════════════════════════════════════════════

describe("Character Timer Expiry", () => {
  let server: TestServer;
  const sockets: TestSocket[] = [];

  const STAGGERED_BAN_CONFIG: DraftConfig = {
    ...CHAR_CONFIG,
    banMode: "staggered",
    numBans: 1,
    timerSeconds: 1,
  };

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterEach(async () => {
    for (const s of sockets) {
      if (s.connected) s.disconnect();
    }
    sockets.length = 0;
    await delay(100);
  });

  afterAll(async () => {
    await server.close();
  });

  function client(): TestSocket {
    const s = createTestClient(server.url);
    sockets.push(s);
    return s;
  }

  it("should lock in hovered character on timer expiry (staggered ban)", async () => {
    const blue = client();
    const red = client();
    await Promise.all([waitForConnect(blue), waitForConnect(red)]);

    const roomId = await createRoom(blue, STAGGERED_BAN_CONFIG);
    await joinRed(red, roomId);
    await startDraft(blue, red);

    // Blue hovers a character (tentative selection) but doesn't lock in
    blue.emit("draft:select", characterIds[0]!);
    await delay(50);

    // Wait for timer to expire and auto-lock
    const state = await waitForDraftState(blue);
    expect(state.blueTeamBans).toContain(characterIds[0]);
  }, 10000);

  it("should only affect turn player in staggered mode", async () => {
    const blue = client();
    const red = client();
    await Promise.all([waitForConnect(blue), waitForConnect(red)]);

    const roomId = await createRoom(blue, STAGGERED_BAN_CONFIG);
    await joinRed(red, roomId);
    await startDraft(blue, red);

    // Both teams hover, but it's blue's turn in staggered mode
    blue.emit("draft:select", characterIds[0]!);
    red.emit("draft:select", characterIds[1]!);
    await delay(50);

    // Wait for blue's timer to expire
    const state = await waitForDraftState(blue);
    // Blue's hover was locked in, red hasn't banned yet (it's now red's turn)
    expect(state.blueTeamBans).toContain(characterIds[0]);
    expect(state.redTeamBans).toHaveLength(0);
  }, 10000);
});

// ════════════════════════════════════════════════════
// Suite H: Awakening Config Validation
// ════════════════════════════════════════════════════

describe("Awakening Config Validation", () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  const post = (payload: Record<string, unknown>) =>
    server.app.inject({
      method: "POST",
      url: "/rooms",
      headers: { "content-type": "application/json" },
      payload,
    });

  it("should accept chosenAwakenings with a valid pair", async () => {
    const [a, b] = CURRENT_AWAKENING_POOL.slice(0, 2);
    const res = await post({ ...CHAR_CONFIG, chosenAwakenings: [a, b] });
    expect(res.statusCode).toBe(201);
  });

  it("should reject chosenAwakenings with only 1 element", async () => {
    const res = await post({ ...CHAR_CONFIG, chosenAwakenings: [CURRENT_AWAKENING_POOL[0]] });
    expect(res.statusCode).toBe(400);
  });

  it("should reject chosenAwakenings with duplicate IDs", async () => {
    const a = CURRENT_AWAKENING_POOL[0];
    const res = await post({ ...CHAR_CONFIG, chosenAwakenings: [a, a] });
    expect(res.statusCode).toBe(400);
  });

  it("should reject chosenAwakenings that violate exclusion rules", async () => {
    // Find a pair that actually has an exclusion
    const [first] = Object.keys(AWAKENING_EXCLUSIONS);
    const excluded = AWAKENING_EXCLUSIONS[first]![0]!;
    const res = await post({ ...CHAR_CONFIG, chosenAwakenings: [first, excluded] });
    expect(res.statusCode).toBe(400);
  });

  it("should reject chosenAwakenings with invalid pool IDs", async () => {
    const res = await post({ ...CHAR_CONFIG, chosenAwakenings: ["fake-id", "also-fake"] });
    expect(res.statusCode).toBe(400);
  });

  it("should accept excludedAwakenings with valid IDs", async () => {
    const res = await post({
      ...CHAR_CONFIG,
      excludedAwakenings: CURRENT_AWAKENING_POOL.slice(0, 3),
    });
    expect(res.statusCode).toBe(201);
  });

  it("should reject excludedAwakenings with invalid IDs", async () => {
    const res = await post({ ...CHAR_CONFIG, excludedAwakenings: ["not-real"] });
    expect(res.statusCode).toBe(400);
  });

  it("should reject excludedAwakenings that leave fewer than 2 in pool", async () => {
    // Exclude all but 1
    const res = await post({
      ...CHAR_CONFIG,
      excludedAwakenings: CURRENT_AWAKENING_POOL.slice(0, CURRENT_AWAKENING_POOL.length - 1),
    });
    expect(res.statusCode).toBe(400);
  });

  it("should reject both chosenAwakenings and excludedAwakenings together", async () => {
    const [a, b] = CURRENT_AWAKENING_POOL.slice(0, 2);
    const res = await post({
      ...CHAR_CONFIG,
      chosenAwakenings: [a, b],
      excludedAwakenings: [CURRENT_AWAKENING_POOL[2]],
    });
    expect(res.statusCode).toBe(400);
  });

  it("should use chosenAwakenings as revealed awakenings in room state", async () => {
    const [a, b] = CURRENT_AWAKENING_POOL.slice(0, 2);
    const res = await post({ ...CHAR_CONFIG, chosenAwakenings: [a, b] });
    const { roomId } = JSON.parse(res.body);

    const getRes = await server.app.inject({ method: "GET", url: `/rooms/${roomId}` });
    const state = JSON.parse(getRes.body) as RoomState;
    expect(state.revealedAwakenings).toEqual([a, b]);
  });

  it("should not reveal excluded awakenings in random mode", async () => {
    const excluded = CURRENT_AWAKENING_POOL.slice(0, 5);
    const res = await post({ ...CHAR_CONFIG, excludedAwakenings: excluded });
    const { roomId } = JSON.parse(res.body);

    const getRes = await server.app.inject({ method: "GET", url: `/rooms/${roomId}` });
    const state = JSON.parse(getRes.body) as RoomState;
    expect(state.revealedAwakenings).not.toBeNull();
    for (const id of excluded) {
      expect(state.revealedAwakenings).not.toContain(id);
    }
  });
});

// ════════════════════════════════════════════════════
// Suite I: Map Pool Validation
// ════════════════════════════════════════════════════

describe("Map Pool Validation", () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  const post = (payload: Record<string, unknown>) =>
    server.app.inject({
      method: "POST",
      url: "/rooms",
      headers: { "content-type": "application/json" },
      payload,
    });

  it("should accept 0 excluded maps (full pool)", async () => {
    const res = await post({ ...MAP_CONFIG, excludedMaps: [] });
    expect(res.statusCode).toBe(201);
  });

  it("should accept fewer than 3 excluded maps for bo1", async () => {
    const res = await post({
      ...MAP_CONFIG,
      mapBanMode: "bo1",
      excludedMaps: [activeMaps[0]!.id],
    });
    expect(res.statusCode).toBe(201);
  });

  it("should reject pool below minimum for bo3", async () => {
    // Exclude 4 maps → pool = 6, but bo3 needs 7
    const res = await post({
      ...MAP_CONFIG,
      mapBanMode: "bo3",
      excludedMaps: activeMaps.slice(0, 4).map(m => m.id),
    });
    expect(res.statusCode).toBe(400);
  });

  it("should reject pool below minimum for bo1", async () => {
    // Exclude 7 maps → pool = 3, but bo1 needs 4
    const res = await post({
      ...MAP_CONFIG,
      mapBanMode: "bo1",
      excludedMaps: activeMaps.slice(0, 7).map(m => m.id),
    });
    expect(res.statusCode).toBe(400);
  });

  it("should reject invalid map IDs", async () => {
    const res = await post({
      ...MAP_CONFIG,
      excludedMaps: ["nonexistent-map"],
    });
    expect(res.statusCode).toBe(400);
  });

  it("should reject duplicate map IDs", async () => {
    const id = activeMaps[0]!.id;
    const res = await post({
      ...MAP_CONFIG,
      excludedMaps: [id, id],
    });
    expect(res.statusCode).toBe(400);
  });
});
