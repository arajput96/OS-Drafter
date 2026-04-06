import type * as Party from "partykit/server";
import {
  DraftMachine,
  CHARACTERS,
  MAPS,
  CURRENT_AWAKENING_POOL,
  pickTwoAwakenings,
} from "../shared/index";
import type {
  DraftConfig,
  DraftState,
  DraftAction,
  RoomState,
  RoomRole,
  Team,
  TurnStep,
  ClientMessage,
  ServerMessage,
  CreateRoomPayload,
  CreateRoomResponse,
} from "../shared/types";
import { DraftTimer } from "./draft-timer";
import { validateDraftConfig, normalizeTeamName } from "./validation";

interface ConnectionState {
  role: RoomRole;
}

export default class DraftRoom implements Party.Server {
  private config: DraftConfig | null = null;
  private blueTeamName?: string;
  private redTeamName?: string;
  private revealedAwakenings: [string, string] | null = null;
  private machine: DraftMachine | null = null;
  private timer: DraftTimer | null = null;
  private selections: { blue: string | null; red: string | null } = {
    blue: null,
    red: null,
  };

  constructor(readonly room: Party.Room) {}

  getConnectionTags(
    connection: Party.Connection,
    ctx: Party.ConnectionContext,
  ): string[] {
    const url = new URL(ctx.request.url);
    const role = url.searchParams.get("role") ?? "spectator";
    return [role];
  }

  async onRequest(req: Party.Request): Promise<Response> {
    if (req.method === "OPTIONS") {
      return this.corsResponse(new Response(null, { status: 204 }), req);
    }
    if (req.method === "POST") {
      return this.corsResponse(await this.handleCreateRoom(req), req);
    }
    if (req.method === "GET") {
      return this.corsResponse(this.handleGetRoom(), req);
    }
    return this.corsResponse(new Response("Method not allowed", { status: 405 }), req);
  }

  private corsResponse(response: Response, req: Party.Request): Response {
    const origin = req.headers.get("origin") ?? "*";
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return response;
  }

  onConnect(connection: Party.Connection<ConnectionState>, ctx: Party.ConnectionContext): void {
    const url = new URL(ctx.request.url);
    const role = (url.searchParams.get("role") ?? "spectator") as RoomRole;

    connection.setState({ role });

    if (!this.config) {
      this.send(connection, { type: "error", message: "Room not configured" });
      connection.close();
      return;
    }

    // Send current state to the connecting client
    this.send(connection, { type: "room:state", state: this.getRoomState() });

    const draftView = this.getDraftViewForRole(role);
    if (draftView) {
      this.send(connection, { type: "draft:state", state: draftView });
      this.send(connection, { type: "draft:phase-change", phase: draftView.phase });
    }

    // Broadcast updated room state to everyone
    this.broadcastRoomState();
  }

  onMessage(message: string, sender: Party.Connection<ConnectionState>): void {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message);
    } catch {
      this.send(sender, { type: "error", message: "Invalid message format" });
      return;
    }

    const role = sender.state?.role;

    switch (msg.type) {
      case "draft:start":
        this.handleStart(sender, role);
        break;
      case "draft:ban-map":
        this.handleBanMap(sender, role, msg.mapId);
        break;
      case "draft:pick-map":
        this.handlePickMap(sender, role, msg.mapId);
        break;
      case "draft:select":
        this.handleSelect(sender, role, msg.characterId);
        break;
      case "draft:lock":
        this.handleLock(sender, role);
        break;
    }
  }

  onClose(connection: Party.Connection<ConnectionState>): void {
    // Broadcast updated connection status
    if (this.config) {
      this.broadcastRoomState();
    }
  }

  // ── HTTP Handlers ──

  private async handleCreateRoom(req: Party.Request): Promise<Response> {
    if (this.config) {
      return Response.json({ error: "Room already configured" }, { status: 409 });
    }

    let payload: CreateRoomPayload;
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const validationError = validateDraftConfig(payload);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const { blueTeamName, redTeamName, ...config } = payload;
    this.config = config;
    this.blueTeamName = normalizeTeamName(blueTeamName);
    this.redTeamName = normalizeTeamName(redTeamName);

    if (config.draftType === "character" && CURRENT_AWAKENING_POOL.length >= 2) {
      this.revealedAwakenings = pickTwoAwakenings(CURRENT_AWAKENING_POOL);
    }

    const origin = req.headers.get("origin") ?? "";
    const response: CreateRoomResponse = {
      roomId: this.room.id,
      blueUrl: `${origin}/room/${this.room.id}?role=blue`,
      redUrl: `${origin}/room/${this.room.id}?role=red`,
      spectatorUrl: `${origin}/room/${this.room.id}?role=spectator`,
      overlayUrl: `${origin}/room/${this.room.id}/overlay`,
    };

    return Response.json(response, { status: 201 });
  }

  private handleGetRoom(): Response {
    if (!this.config) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }
    return Response.json(this.getRoomState());
  }

  // ── Draft Action Handlers ──

  private handleStart(
    sender: Party.Connection<ConnectionState>,
    role: RoomRole | undefined,
  ): void {
    if (role !== "blue" && role !== "red") {
      this.send(sender, { type: "error", message: "Only team members can start the draft" });
      return;
    }

    if (!this.isBlueConnected() || !this.isRedConnected()) {
      this.send(sender, { type: "error", message: "Both teams must be connected to start the draft" });
      return;
    }

    if (this.machine) {
      this.send(sender, { type: "error", message: "Draft has already been created" });
      return;
    }

    const characterIds = CHARACTERS.map((c) => c.id);
    const mapIds = MAPS.filter((m) => m.active).map((m) => m.id);
    const awakeningIds = [...CURRENT_AWAKENING_POOL];

    if (this.config!.draftType === "map") {
      this.machine = new DraftMachine(this.config!, [], mapIds, []);
    } else {
      this.machine = new DraftMachine(this.config!, characterIds, [], awakeningIds);
      if (this.revealedAwakenings) {
        this.machine.revealAwakenings(this.revealedAwakenings);
      }
    }

    const result = this.machine.start();
    if (!result.ok) {
      this.send(sender, { type: "error", message: result.error });
      return;
    }

    this.broadcastDraftState();
    this.broadcastPhaseChange();
    this.startTimer();
  }

  private handleBanMap(
    sender: Party.Connection<ConnectionState>,
    role: RoomRole | undefined,
    mapId: string,
  ): void {
    const team = this.getTeam(sender, role);
    if (!team) return;

    if (!this.machine) {
      this.send(sender, { type: "error", message: "Draft has not started" });
      return;
    }

    const prevIndex = this.machine.getState().turnIndex;
    const result = this.machine.banMap(team, mapId);

    if (!result.ok) {
      this.send(sender, { type: "error", message: result.error });
      return;
    }

    const action: DraftAction = { type: "map_ban", team, mapId, index: prevIndex };
    this.broadcastMessage({ type: "draft:action", action });
    this.afterAction(prevIndex);
  }

  private handlePickMap(
    sender: Party.Connection<ConnectionState>,
    role: RoomRole | undefined,
    mapId: string,
  ): void {
    const team = this.getTeam(sender, role);
    if (!team) return;

    if (!this.machine) {
      this.send(sender, { type: "error", message: "Draft has not started" });
      return;
    }

    const prevIndex = this.machine.getState().turnIndex;
    const result = this.machine.pickMap(team, mapId);

    if (!result.ok) {
      this.send(sender, { type: "error", message: result.error });
      return;
    }

    const action: DraftAction = { type: "map_pick", team, mapId, index: prevIndex };
    this.broadcastMessage({ type: "draft:action", action });
    this.afterAction(prevIndex);
  }

  private handleSelect(
    sender: Party.Connection<ConnectionState>,
    role: RoomRole | undefined,
    characterId: string,
  ): void {
    const team = this.getTeam(sender, role);
    if (!team) return;

    this.selections[team] = characterId;
  }

  private handleLock(
    sender: Party.Connection<ConnectionState>,
    role: RoomRole | undefined,
  ): void {
    const team = this.getTeam(sender, role);
    if (!team) return;

    if (!this.machine) {
      this.send(sender, { type: "error", message: "Draft has not started" });
      return;
    }

    const selection = this.selections[team];
    if (!selection) {
      this.send(sender, { type: "error", message: "No character selected — select a character first" });
      return;
    }

    const step = this.machine.getCurrentStep();
    if (!step) {
      this.send(sender, { type: "error", message: "No active step" });
      return;
    }

    const prevIndex = this.machine.getState().turnIndex;
    let result;
    let action: DraftAction;

    if (step.phase === "CHAR_BAN") {
      result = this.machine.banCharacter(team, selection);
      action = { type: "ban", team, characterId: selection, index: prevIndex };
    } else if (step.phase === "CHAR_PICK") {
      result = this.machine.pickCharacter(team, selection);
      action = { type: "pick", team, characterId: selection, index: prevIndex };
    } else {
      this.send(sender, { type: "error", message: `Lock is not valid during ${step.phase} phase` });
      return;
    }

    if (!result.ok) {
      this.send(sender, { type: "error", message: result.error });
      return;
    }

    this.selections[team] = null;
    this.broadcastMessage({ type: "draft:action", action });
    this.afterAction(prevIndex);
  }

  // ── Helpers ──

  private getTeam(
    sender: Party.Connection<ConnectionState>,
    role: RoomRole | undefined,
  ): Team | null {
    if (role !== "blue" && role !== "red") {
      this.send(sender, { type: "error", message: "Spectators cannot perform draft actions" });
      return null;
    }
    return role;
  }

  private afterAction(prevIndex: number): void {
    if (!this.machine) return;

    this.broadcastDraftState();

    const currentIndex = this.machine.getState().turnIndex;

    if (currentIndex !== prevIndex) {
      this.selections.blue = null;
      this.selections.red = null;

      if (this.machine.isComplete()) {
        this.stopTimer();
        this.broadcastPhaseChange();
      } else {
        const prevPhase = this.machine.getState().turnOrder[prevIndex]?.phase;
        const currentPhase = this.machine.getState().phase;
        if (prevPhase !== currentPhase) {
          this.broadcastPhaseChange();
        }
        this.startTimer();
      }
    }
  }

  // ── Timer ──

  private startTimer(): void {
    this.stopTimer();

    const state = this.machine?.getState();
    if (!state || state.phase === "WAITING" || state.phase === "COMPLETE") return;

    this.timer = new DraftTimer(state.config.timerSeconds, {
      onTick: (remaining) => {
        this.broadcastMessage({ type: "draft:timer", remaining });
      },
      onExpire: () => {
        if (!this.machine) return;

        const prevIndex = this.machine.getState().turnIndex;

        this.lockTentativeSelections();

        const afterLockIndex = this.machine.getState().turnIndex;

        if (afterLockIndex !== prevIndex) {
          this.selections.blue = null;
          this.selections.red = null;
          this.broadcastDraftState();

          if (this.machine.isComplete()) {
            this.stopTimer();
            this.broadcastPhaseChange();
          } else {
            const prevPhase = this.machine.getState().turnOrder[prevIndex]?.phase;
            if (prevPhase !== this.machine.getState().phase) {
              this.broadcastPhaseChange();
            }
            this.startTimer();
          }
          return;
        }

        const result = this.machine.expireTimer();

        if (result.ok) {
          this.selections.blue = null;
          this.selections.red = null;
          this.broadcastDraftState();

          if (this.machine.getState().turnIndex !== prevIndex) {
            if (this.machine.isComplete()) {
              this.stopTimer();
              this.broadcastPhaseChange();
            } else {
              const prevPhase = this.machine.getState().turnOrder[prevIndex]?.phase;
              if (prevPhase !== this.machine.getState().phase) {
                this.broadcastPhaseChange();
              }
              this.startTimer();
            }
          }
        } else {
          this.stopTimer();
          this.broadcastMessage({ type: "error", message: result.error });
        }
      },
    });

    this.timer.start();
  }

  private stopTimer(): void {
    this.timer?.stop();
    this.timer = null;
  }

  private lockTentativeSelections(): void {
    if (!this.machine) return;

    const step = this.machine.getCurrentStep();
    if (!step) return;

    if (step.phase !== "CHAR_BAN" && step.phase !== "CHAR_PICK") return;

    const tryLock = (team: Team) => {
      const selection = this.selections[team];
      if (!selection) return;

      const result =
        step.phase === "CHAR_BAN"
          ? this.machine!.banCharacter(team, selection)
          : this.machine!.pickCharacter(team, selection);

      if (result.ok) {
        this.selections[team] = null;
      }
    };

    if (step.team === "both") {
      const pending = this.machine.getState().pendingActions;
      if (pending?.blue === null) tryLock("blue");
      if (pending?.red === null) tryLock("red");
    } else {
      tryLock(step.team as Team);
    }
  }

  // ── Connection queries ──

  private getConnectionsByRole(role: RoomRole): Party.Connection<ConnectionState>[] {
    return [...this.room.getConnections(role)] as Party.Connection<ConnectionState>[];
  }

  private isBlueConnected(): boolean {
    return this.getConnectionsByRole("blue").length > 0;
  }

  private isRedConnected(): boolean {
    return this.getConnectionsByRole("red").length > 0;
  }

  private getSpectatorCount(): number {
    return this.getConnectionsByRole("spectator").length;
  }

  // ── Broadcasting ──

  private send(connection: Party.Connection, msg: ServerMessage): void {
    connection.send(JSON.stringify(msg));
  }

  private broadcastMessage(msg: ServerMessage, exclude?: string[]): void {
    const json = JSON.stringify(msg);
    for (const conn of this.room.getConnections()) {
      if (!exclude || !exclude.includes(conn.id)) {
        conn.send(json);
      }
    }
  }

  private broadcastRoomState(): void {
    const state = this.getRoomState();
    this.broadcastMessage({ type: "room:state", state });
  }

  private broadcastDraftState(): void {
    if (!this.machine) return;

    for (const conn of this.getConnectionsByRole("blue")) {
      this.send(conn, { type: "draft:state", state: this.machine.getTeamView("blue") });
    }
    for (const conn of this.getConnectionsByRole("red")) {
      this.send(conn, { type: "draft:state", state: this.machine.getTeamView("red") });
    }

    const spectatorView = this.getSpectatorDraftView();
    if (spectatorView) {
      for (const conn of this.getConnectionsByRole("spectator")) {
        this.send(conn, { type: "draft:state", state: spectatorView });
      }
    }
  }

  private broadcastPhaseChange(): void {
    const state = this.machine?.getState();
    if (state) {
      this.broadcastMessage({ type: "draft:phase-change", phase: state.phase });
    }
  }

  // ── State ──

  private getDraftViewForRole(role: RoomRole): DraftState | null {
    if (role === "blue") return this.machine?.getTeamView("blue") ?? null;
    if (role === "red") return this.machine?.getTeamView("red") ?? null;
    return this.getSpectatorDraftView();
  }

  private getSpectatorDraftView(): DraftState | null {
    const state = this.machine?.getState();
    if (!state) return null;
    if (!state.pendingActions) return state;
    return {
      ...state,
      pendingActions: { blue: null, red: null },
    };
  }

  private getRoomState(): RoomState {
    return {
      roomId: this.room.id,
      config: this.config!,
      blueConnected: this.isBlueConnected(),
      redConnected: this.isRedConnected(),
      spectatorCount: this.getSpectatorCount(),
      draft: this.machine?.getState() ?? null,
      revealedAwakenings: this.revealedAwakenings,
      ...(this.blueTeamName && { blueTeamName: this.blueTeamName }),
      ...(this.redTeamName && { redTeamName: this.redTeamName }),
    };
  }
}

DraftRoom satisfies Party.Worker;
