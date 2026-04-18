import {
  DraftMachine,
  CHARACTERS,
  MAPS,
  CURRENT_AWAKENING_POOL,
  pickTwoAwakenings,
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
  readonly blueTeamName?: string;
  readonly redTeamName?: string;

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

  constructor(roomId: string, config: DraftConfig, blueTeamName?: string, redTeamName?: string) {
    this.roomId = roomId;
    this.config = config;
    this.blueTeamName = blueTeamName;
    this.redTeamName = redTeamName;

    // For character drafts, reveal awakenings at room creation time
    if (config.draftType === "character" && CURRENT_AWAKENING_POOL.length >= 2) {
      if (config.chosenAwakenings) {
        this.revealedAwakenings = config.chosenAwakenings;
      } else {
        let pool = [...CURRENT_AWAKENING_POOL];
        if (config.excludedAwakenings?.length) {
          const excluded = new Set(config.excludedAwakenings);
          pool = pool.filter(id => !excluded.has(id));
        }
        if (pool.length >= 2) {
          this.revealedAwakenings = pickTwoAwakenings(pool);
        }
      }
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
    const awakeningIds = [...CURRENT_AWAKENING_POOL];

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

  /**
   * Before timer expiry falls back to random, try to commit any tentative
   * (hovered) selections the players have made via draft:select.
   *
   * For single-team (staggered) turns, a successful lock advances the step,
   * so callers must check whether the step moved and skip expireTimer if so.
   *
   * For simultaneous turns, locking a tentative selection stores it as a
   * pending action (the step only advances when both sides have submitted),
   * so expireTimer still needs to run to fill any remaining gaps.
   */
  private lockTentativeSelections(): void {
    if (!this.machine) return;

    const step = this.machine.getCurrentStep();
    if (!step) return;

    // Only applies to character ban/pick phases
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
      // If invalid, leave it for expireTimer() to handle with random
    };

    if (step.team === "both") {
      // Simultaneous: lock in whichever teams haven't submitted a pending action yet
      const pending = this.machine.getState().pendingActions;
      if (pending?.blue === null) tryLock("blue");
      if (pending?.red === null) tryLock("red");
    } else {
      tryLock(step.team as Team);
    }
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

        // Try to lock in tentative selections before falling back to random.
        // For staggered turns this may advance the step directly.
        this.lockTentativeSelections();

        const afterLockIndex = this.machine.getState().turnIndex;

        if (afterLockIndex !== prevIndex) {
          // Tentative selection already advanced the step — skip expireTimer
          this.clearSelections();
          this.broadcastTentative(io, "blue", null);
          this.broadcastTentative(io, "red", null);
          this.broadcastDraftState(io);

          if (this.machine.isComplete()) {
            this.stopTimer();
            this.broadcastPhaseChange(io);
          } else {
            const prevPhase = this.machine.getState().turnOrder[prevIndex]?.phase;
            if (prevPhase !== this.machine.getState().phase) {
              this.broadcastPhaseChange(io);
            }
            this.startTimer(io);
          }
          return;
        }

        // Tentative lock didn't fully resolve the step — fall back to random
        const result = this.machine.expireTimer();

        if (result.ok) {
          this.clearSelections();
          this.broadcastTentative(io, "blue", null);
          this.broadcastTentative(io, "red", null);
          this.broadcastDraftState(io);

          if (this.machine.getState().turnIndex !== prevIndex) {
            if (this.machine.isComplete()) {
              this.stopTimer();
              this.broadcastPhaseChange(io);
            } else {
              const prevPhase = this.machine.getState().turnOrder[prevIndex]?.phase;
              if (prevPhase !== this.machine.getState().phase) {
                this.broadcastPhaseChange(io);
              }
              this.startTimer(io);
            }
          }
        } else {
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

  /** Push a team's tentative selection to spectator sockets only (never to the teams). */
  broadcastTentative(io: TypedServer, team: Team, characterId: string | null): void {
    for (const socketId of this.spectatorSockets) {
      io.to(socketId).emit("draft:tentative", { team, characterId });
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
      ...(this.blueTeamName && { blueTeamName: this.blueTeamName }),
      ...(this.redTeamName && { redTeamName: this.redTeamName }),
    };
  }

  // ── Cleanup ──

  destroy(): void {
    this.stopTimer();
  }
}
