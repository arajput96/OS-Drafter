import type {
  DraftConfig,
  DraftResult,
  DraftState,
  MapBanState,
  AwakeningRevealState,
  Team,
  TurnStep,
} from "../types.js";
import { generateTurnOrder } from "./turnOrders.js";
import { resolveMapRoles } from "./mapRoles.js";

/**
 * Pure, synchronous draft state machine. No I/O, no timers.
 * The server is responsible for timer management and calling expireTimer().
 */
export class DraftMachine {
  private state: DraftState;
  private characterIds: string[];
  private mapIds: string[];
  private awakeningIds: string[];

  constructor(
    config: DraftConfig,
    characterIds: string[],
    mapIds: string[],
    awakeningIds: string[] = [],
  ) {
    this.characterIds = [...characterIds];
    this.awakeningIds = [...awakeningIds];

    // Filter excluded maps from the pool
    const excluded = new Set(config.excludedMaps);
    this.mapIds = mapIds.filter((id) => !excluded.has(id));

    const turnOrder = generateTurnOrder(config);

    const mapBans: MapBanState = {
      mapPool: [...this.mapIds],
      blueBans: [],
      redBans: [],
      bluePicks: [],
      redPicks: [],
      selectedMap: null,
      gameOrder: [null, null, null],
    };

    const awakeningReveal: AwakeningRevealState = {
      revealedPair: null,
    };

    this.state = {
      phase: "WAITING",
      config,
      mapBans,
      awakeningReveal,
      blueTeamBans: [],
      redTeamBans: [],
      blueTeamPicks: [],
      redTeamPicks: [],
      currentTurn: "blue",
      timerRemaining: config.timerSeconds,
      turnOrder,
      turnIndex: -1,
      pendingActions: null,
    };
  }

  // ── Queries ──

  getState(): Readonly<DraftState> {
    return this.state;
  }

  getCurrentStep(): TurnStep | null {
    if (this.state.turnIndex < 0 || this.state.turnIndex >= this.state.turnOrder.length) {
      return null;
    }
    return this.state.turnOrder[this.state.turnIndex]!;
  }

  isComplete(): boolean {
    return this.state.phase === "COMPLETE";
  }

  getAvailableCharacters(team: Team): string[] {
    const { blueTeamBans, redTeamBans, blueTeamPicks, redTeamPicks, config } = this.state;
    const allBans = [...blueTeamBans, ...redTeamBans].filter(Boolean) as string[];

    // Also exclude pending bans/picks from the opponent in simultaneous mode
    const pendingValues: string[] = [];
    if (this.state.pendingActions) {
      const opponent: Team = team === "blue" ? "red" : "blue";
      if (this.state.pendingActions[opponent]) {
        pendingValues.push(this.state.pendingActions[opponent]);
      }
    }

    return this.characterIds.filter((id) => {
      // Banned characters are always unavailable
      if (allBans.includes(id)) return false;

      // Pending bans from opponent are also unavailable
      if (pendingValues.includes(id) && this.state.phase === "CHAR_BAN") return false;

      if (config.mirrorRule === "no_mirrors") {
        // Cannot pick any character already picked by either team
        const allPicks = [...blueTeamPicks, ...redTeamPicks].filter(Boolean) as string[];
        if (allPicks.includes(id)) return false;
        // Also exclude opponent's pending pick
        if (pendingValues.includes(id) && this.state.phase === "CHAR_PICK") return false;
      } else if (config.mirrorRule === "team_mirrors") {
        // Cannot pick a character already picked by your own team
        const teamPicks = (team === "blue" ? blueTeamPicks : redTeamPicks).filter(Boolean) as string[];
        if (teamPicks.includes(id)) return false;
      }
      // full_duplicates: only bans restrict

      return true;
    });
  }

  getAvailableMaps(): string[] {
    const { blueBans, redBans, bluePicks, redPicks } = this.state.mapBans;
    const unavailable = [...blueBans, ...redBans, ...bluePicks, ...redPicks];
    return this.state.mapBans.mapPool.filter((id) => !unavailable.includes(id));
  }

  /**
   * Returns a view of the state safe to send to a specific team.
   * Hides the opponent's pending action in simultaneous mode.
   */
  getTeamView(team: Team): Readonly<DraftState> {
    if (!this.state.pendingActions) return this.state;

    const opponent: Team = team === "blue" ? "red" : "blue";
    return {
      ...this.state,
      pendingActions: {
        ...this.state.pendingActions,
        [opponent]: null,
      },
    };
  }

  // ── Commands ──

  /**
   * Reveal a pair of awakenings. If a pair is provided, use it directly.
   * Otherwise, pick two distinct random awakenings.
   * Called at room creation time for character drafts.
   */
  revealAwakenings(pair?: [string, string]): void {
    if (pair) {
      this.state.awakeningReveal.revealedPair = pair;
      return;
    }
    if (this.awakeningIds.length >= 2) {
      const firstIndex = Math.floor(Math.random() * this.awakeningIds.length);
      let secondIndex = Math.floor(Math.random() * (this.awakeningIds.length - 1));
      if (secondIndex >= firstIndex) secondIndex += 1;
      this.state.awakeningReveal.revealedPair = [
        this.awakeningIds[firstIndex]!,
        this.awakeningIds[secondIndex]!,
      ];
    }
  }

  start(): DraftResult {
    if (this.state.phase !== "WAITING") {
      return { ok: false, error: "Draft has already started" };
    }

    this.state.turnIndex = 0;
    this.applyCurrentStep();
    return { ok: true, state: this.state };
  }

  banMap(team: Team, mapId: string): DraftResult {
    const step = this.getCurrentStep();
    const error = this.validateStep(team, step, "MAP_BAN", "map_ban");
    if (error) return { ok: false, error };

    const available = this.getAvailableMaps();
    if (!available.includes(mapId)) {
      return { ok: false, error: `Map "${mapId}" is not available for banning` };
    }

    if (team === "blue") {
      this.state.mapBans.blueBans.push(mapId);
    } else {
      this.state.mapBans.redBans.push(mapId);
    }

    this.advance();
    return { ok: true, state: this.state };
  }

  pickMap(team: Team, mapId: string): DraftResult {
    const step = this.getCurrentStep();
    const error = this.validateStep(team, step, "MAP_BAN", "map_pick");
    if (error) return { ok: false, error };

    const available = this.getAvailableMaps();
    if (!available.includes(mapId)) {
      return { ok: false, error: `Map "${mapId}" is not available for picking` };
    }

    if (team === "blue") {
      this.state.mapBans.bluePicks.push(mapId);
    } else {
      this.state.mapBans.redPicks.push(mapId);
    }

    // Assign to game order based on map role and mode
    const { mapBanMode } = this.state.config;
    if (mapBanMode === "bo1") {
      this.state.mapBans.selectedMap = mapId;
    } else if (mapBanMode === "bo3") {
      const { sideSelect, mapSelect } = resolveMapRoles(this.state.config);
      if (team === mapSelect) {
        this.state.mapBans.gameOrder[0] = mapId; // M's pick = game 1
      } else if (team === sideSelect) {
        this.state.mapBans.gameOrder[1] = mapId; // S's pick = game 2
      }
    }

    this.advance();
    return { ok: true, state: this.state };
  }

  banCharacter(team: Team, characterId: string): DraftResult {
    const step = this.getCurrentStep();
    const error = this.validateStep(team, step, "CHAR_BAN", "ban");
    if (error) return { ok: false, error };

    if (!this.characterIds.includes(characterId)) {
      return { ok: false, error: `Character "${characterId}" does not exist` };
    }

    const allBans = [...this.state.blueTeamBans, ...this.state.redTeamBans].filter(Boolean) as string[];
    if (allBans.includes(characterId)) {
      return { ok: false, error: `Character "${characterId}" is already banned` };
    }

    // In simultaneous mode, also check if the opponent has this as a pending ban
    if (step!.team === "both" && this.state.pendingActions) {
      const opponent: Team = team === "blue" ? "red" : "blue";
      if (this.state.pendingActions[opponent] === characterId) {
        return { ok: false, error: `Character "${characterId}" is already being banned by the other team` };
      }
    }

    // Handle simultaneous bans
    if (step!.team === "both") {
      return this.handleSimultaneousAction(team, characterId, "ban");
    }

    if (team === "blue") {
      this.state.blueTeamBans.push(characterId);
    } else {
      this.state.redTeamBans.push(characterId);
    }

    this.advance();
    return { ok: true, state: this.state };
  }

  pickCharacter(team: Team, characterId: string): DraftResult {
    const step = this.getCurrentStep();
    const error = this.validateStep(team, step, "CHAR_PICK", "pick");
    if (error) return { ok: false, error };

    if (!this.characterIds.includes(characterId)) {
      return { ok: false, error: `Character "${characterId}" does not exist` };
    }

    const available = this.getAvailableCharacters(team);
    if (!available.includes(characterId)) {
      return { ok: false, error: `Character "${characterId}" is not available` };
    }

    // Handle simultaneous picks
    if (step!.team === "both") {
      return this.handleSimultaneousAction(team, characterId, "pick");
    }

    if (team === "blue") {
      this.state.blueTeamPicks.push(characterId);
    } else {
      this.state.redTeamPicks.push(characterId);
    }

    this.advance();
    return { ok: true, state: this.state };
  }

  /**
   * Called by the server when the timer expires.
   * Auto-selects a random valid option for the current turn.
   */
  expireTimer(): DraftResult {
    const step = this.getCurrentStep();
    if (!step) return { ok: false, error: "No active step" };

    if (step.team === "both" && this.state.pendingActions) {
      // In simultaneous mode, auto-fill for any team that hasn't submitted
      const pending = this.state.pendingActions;
      if (pending.blue === null) {
        const randomId = this.randomSelection("blue", step.type);
        if (randomId) pending.blue = randomId;
      }
      if (pending.red === null) {
        const randomId = this.randomSelection("red", step.type);
        if (randomId) pending.red = randomId;
      }
      // If we still don't have valid selections for both teams, fail gracefully
      if (pending.blue === null || pending.red === null) {
        return { ok: false, error: "No valid options available for simultaneous selection" };
      }
      // Commit both (simultaneous only applies to ban/pick steps)
      return this.commitSimultaneous(step.type as "ban" | "pick");
    }

    const team = step.team as Team;
    const randomId = this.randomSelection(team, step.type);
    if (!randomId) return { ok: false, error: "No valid options available" };

    switch (step.type) {
      case "map_ban":
        return this.banMap(team, randomId);
      case "map_pick":
        return this.pickMap(team, randomId);
      case "ban":
        return this.banCharacter(team, randomId);
      case "pick":
        return this.pickCharacter(team, randomId);
    }
  }

  // ── Internal ──

  private validateStep(
    team: Team,
    step: TurnStep | null,
    expectedPhase: string,
    expectedType: string,
  ): string | null {
    if (this.state.phase === "COMPLETE") {
      return "Draft is already complete";
    }
    if (this.state.phase === "WAITING") {
      return "Draft has not started";
    }
    if (!step) {
      return "No active step";
    }
    if (step.phase !== expectedPhase) {
      return `Expected phase "${expectedPhase}" but current phase is "${step.phase}"`;
    }
    if (step.type !== expectedType) {
      return `Expected action "${expectedType}" but current action is "${step.type}"`;
    }
    if (step.team !== "both" && step.team !== team) {
      return `It is not ${team}'s turn`;
    }
    // For simultaneous: check if this team already submitted
    if (step.team === "both" && this.state.pendingActions?.[team] !== null) {
      return `${team} has already submitted for this step`;
    }
    return null;
  }

  private handleSimultaneousAction(
    team: Team,
    id: string,
    type: "ban" | "pick",
  ): DraftResult {
    if (!this.state.pendingActions) {
      this.state.pendingActions = { blue: null, red: null };
    }

    this.state.pendingActions[team] = id;

    // Check if both teams have submitted
    if (this.state.pendingActions.blue !== null && this.state.pendingActions.red !== null) {
      return this.commitSimultaneous(type);
    }

    // Only one team submitted so far
    return { ok: true, state: this.state };
  }

  private commitSimultaneous(type: "ban" | "pick"): DraftResult {
    const pending = this.state.pendingActions!;
    const blueId = pending.blue!;
    const redId = pending.red!;

    if (type === "ban") {
      this.state.blueTeamBans.push(blueId);
      this.state.redTeamBans.push(redId);
    } else {
      this.state.blueTeamPicks.push(blueId);
      this.state.redTeamPicks.push(redId);
    }

    this.state.pendingActions = null;
    this.advance();
    return { ok: true, state: this.state };
  }

  private advance(): void {
    this.state.turnIndex++;

    if (this.state.turnIndex >= this.state.turnOrder.length) {
      this.state.phase = "COMPLETE";
      this.state.currentTurn = "blue"; // doesn't matter, draft is over

      // For map drafts: assign remaining map to game 3 in Bo3
      if (this.state.config.draftType === "map" && this.state.config.mapBanMode === "bo3") {
        this.assignRemainingMapToGame3();
      }
      return;
    }

    this.applyCurrentStep();
  }

  private applyCurrentStep(): void {
    const step = this.state.turnOrder[this.state.turnIndex];
    if (!step) return;

    this.state.phase = step.phase;
    this.state.currentTurn = step.team;
    this.state.timerRemaining = this.state.config.timerSeconds;

    // Initialize pending actions for simultaneous steps
    if (step.team === "both") {
      this.state.pendingActions = { blue: null, red: null };
    } else {
      this.state.pendingActions = null;
    }
  }

  private assignRemainingMapToGame3(): void {
    const available = this.getAvailableMaps();
    if (available.length >= 1) {
      this.state.mapBans.gameOrder[2] = available[0]!;
    }
  }


  private randomSelection(team: Team, type: string): string | null {
    let pool: string[];

    switch (type) {
      case "map_ban":
      case "map_pick":
        pool = this.getAvailableMaps();
        break;
      case "ban": {
        const allBans = [...this.state.blueTeamBans, ...this.state.redTeamBans].filter(Boolean) as string[];
        // Also exclude pending bans from the other team
        const pendingBans: string[] = [];
        if (this.state.pendingActions) {
          const opponent: Team = team === "blue" ? "red" : "blue";
          if (this.state.pendingActions[opponent]) {
            pendingBans.push(this.state.pendingActions[opponent]);
          }
        }
        pool = this.characterIds.filter(
          (id) => !allBans.includes(id) && !pendingBans.includes(id),
        );
        break;
      }
      case "pick":
        pool = this.getAvailableCharacters(team);
        break;
      default:
        return null;
    }

    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)]!;
  }
}
