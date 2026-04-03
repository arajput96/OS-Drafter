import {
  DraftMachine,
  CHARACTERS,
  MAPS,
  AWAKENINGS,
  type DraftConfig,
  type DraftState,
  type DraftResult,
  type RoomState,
  type RoomRole,
  type Team,
  type TurnStep,
} from "@os-drafter/shared";
import type { TypedServer } from "./types.js";
import { DraftTimer } from "./DraftTimer.js";

export class Room {
  readonly roomId: string;
  readonly config: DraftConfig;

  /** Socket IDs per role */
  private blueSockets = new Set<string>();
  private redSockets = new Set<string>();
  private spectatorSockets = new Set<string>();

  /** Tentative character selections (preview before lock-in) */
  private selections: { blue: string | null; red: string | null } = {
    blue: null,
    red: null,
  };

  /** Revealed awakenings for character drafts (set at room creation) */
  private revealedAwakenings: [string, string] | null = null;

  private machine: DraftMachine | null = null;
  private timer: DraftTimer | null = null;

  constructor(roomId: string, config: DraftConfig) {
    this.roomId = roomId;
    this.config = config;

    // For character drafts, reveal awakenings at room creation time
    if (config.draftType === "character" && AWAKENINGS.length >= 2) {
      const firstIndex = Math.floor(Math.random() * AWAKENINGS.length);
      let secondIndex = Math.floor(Math.random() * (AWAKENINGS.length - 1));
      if (secondIndex >= firstIndex) secondIndex += 1;
      this.revealedAwakenings = [
        AWAKENINGS[firstIndex]!.id,
        AWAKENINGS[secondIndex]!.id,
      ];
    }
  }

  // ── Connection Management ──

  addSocket(socketId: string, role: RoomRole): void {
    switch (role) {
      case "blue":
        this.blueSockets.add(socketId);
        break;
      case "red":
        this.redSockets.add(socketId);
        break;
      case "spectator":
        this.spectatorSockets.add(socketId);
        break;
    }
  }

  removeSocket(socketId: string): RoomRole | null {
    if (this.blueSockets.delete(socketId)) return "blue";
    if (this.redSockets.delete(socketId)) return "red";
    if (this.spectatorSockets.delete(socketId)) return "spectator";
    return null;
  }

  isBlueConnected(): boolean {
    return this.blueSockets.size > 0;
  }

  isRedConnected(): boolean {
    return this.redSockets.size > 0;
  }

  getSpectatorCount(): number {
    return this.spectatorSockets.size;
  }

  getTotalSockets(): number {
    return this.blueSockets.size + this.redSockets.size + this.spectatorSockets.size;
  }

  // ── Selection (tentative preview) ──

  setSelection(team: Team, characterId: string | null): void {
    this.selections[team] = characterId;
  }

  getSelection(team: Team): string | null {
    return this.selections[team];
  }

  clearSelections(): void {
    this.selections.blue = null;
    this.selections.red = null;
  }

  // ── Draft Machine ──

  getMachine(): DraftMachine | null {
    return this.machine;
  }

  startDraft(): DraftResult {
    if (this.machine) {
      return { ok: false, error: "Draft has already been created" };
    }

    const characterIds = CHARACTERS.map((c) => c.id);
    const mapIds = MAPS.filter((m) => m.active).map((m) => m.id);
    const awakeningIds = AWAKENINGS.map((a) => a.id);

    if (this.config.draftType === "map") {
      // Map draft: only needs maps, no characters or awakenings
      this.machine = new DraftMachine(this.config, [], mapIds, []);
    } else {
      // Character draft: needs characters and awakenings, no maps
      this.machine = new DraftMachine(this.config, characterIds, [], awakeningIds);
      // Pass the pre-revealed pair so the draft matches the waiting room
      if (this.revealedAwakenings) {
        this.machine.revealAwakenings(this.revealedAwakenings);
      }
    }

    return this.machine.start();
  }

  getDraftState(): DraftState | null {
    return this.machine?.getState() ?? null;
  }

  getTeamDraftView(team: Team): DraftState | null {
    return this.machine?.getTeamView(team) ?? null;
  }

  /** Returns a spectator-safe view (hides all pending actions) */
  getSpectatorDraftView(): DraftState | null {
    const state = this.machine?.getState();
    if (!state) return null;
    if (!state.pendingActions) return state;
    return {
      ...state,
      pendingActions: { blue: null, red: null },
    };
  }

  getCurrentStep(): TurnStep | null {
    return this.machine?.getCurrentStep() ?? null;
  }

  // ── Timer ──

  startTimer(io: TypedServer): void {
    this.stopTimer();

    const state = this.machine?.getState();
    if (!state || state.phase === "WAITING" || state.phase === "COMPLETE") return;

    this.timer = new DraftTimer(state.config.timerSeconds, {
      onTick: (remaining) => {
        io.to(this.roomId).emit("draft:timer", remaining);
      },
      onExpire: () => {
        if (!this.machine) return;

        const prevIndex = this.machine.getState().turnIndex;
        const result = this.machine.expireTimer();

        if (result.ok) {
          this.clearSelections();
          this.broadcastDraftState(io);

          // If the step advanced, check if draft is complete or restart timer
          if (this.machine.getState().turnIndex !== prevIndex) {
            if (this.machine.isComplete()) {
              this.stopTimer();
              this.broadcastPhaseChange(io);
            } else {
              this.broadcastPhaseChange(io);
              this.startTimer(io);
            }
          }
        } else {
          // TODO: Surface expireTimer failures to clients. This can happen if
          // no valid options remain (e.g., all characters banned/picked). Consider
          // emitting an error event and gracefully ending the draft.
          this.stopTimer();
          io.to(this.roomId).emit("error", result.error);
        }
      },
    });

    this.timer.start();
  }

  stopTimer(): void {
    this.timer?.stop();
    this.timer = null;
  }

  // ── Broadcasting ──

  broadcastRoomState(io: TypedServer): void {
    io.to(this.roomId).emit("room:state", this.getRoomState());
  }

  broadcastDraftState(io: TypedServer): void {
    if (!this.machine) return;

    // Send team-specific views to each team
    for (const socketId of this.blueSockets) {
      io.to(socketId).emit("draft:state", this.machine.getTeamView("blue"));
    }
    for (const socketId of this.redSockets) {
      io.to(socketId).emit("draft:state", this.machine.getTeamView("red"));
    }
    // Spectators get sanitized view
    const spectatorView = this.getSpectatorDraftView();
    if (spectatorView) {
      for (const socketId of this.spectatorSockets) {
        io.to(socketId).emit("draft:state", spectatorView);
      }
    }
  }

  broadcastPhaseChange(io: TypedServer): void {
    const state = this.machine?.getState();
    if (state) {
      io.to(this.roomId).emit("draft:phase-change", state.phase);
    }
  }

  // ── State Snapshot ──

  getRoomState(): RoomState {
    return {
      roomId: this.roomId,
      config: this.config,
      blueConnected: this.isBlueConnected(),
      redConnected: this.isRedConnected(),
      spectatorCount: this.getSpectatorCount(),
      draft: this.getDraftState(),
      revealedAwakenings: this.revealedAwakenings,
    };
  }

  // ── Cleanup ──

  destroy(): void {
    this.stopTimer();
  }
}
