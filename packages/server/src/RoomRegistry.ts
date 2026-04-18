import { Room } from "./Room.js";
import type { DraftConfig } from "@os-drafter/shared";

/**
 * In-memory room storage. Rooms are ephemeral (no database for MVP).
 *
 * TODO: Add TTL-based eviction (createdAt + periodic sweep) and a max room
 * limit or rate limiting on creation to prevent memory leaks from abandoned
 * rooms and DoS via mass room creation.
 */
/** How long to keep an empty room alive before deletion. Guards against client
 *  refreshes / React Strict-Mode remounts disconnecting briefly while a lone
 *  spectator is loading an overlay. */
const EMPTY_ROOM_GRACE_MS = 30_000;

class RoomRegistry {
  private rooms = new Map<string, Room>();
  private pendingDeletions = new Map<string, NodeJS.Timeout>();
  private graceMs = EMPTY_ROOM_GRACE_MS;

  /** Override the empty-room grace period. Tests use this to avoid waiting 30s. */
  setGraceMs(ms: number): void {
    this.graceMs = ms;
  }

  create(config: DraftConfig, blueTeamName?: string, redTeamName?: string): Room {
    let roomId: string;
    do {
      roomId = crypto.randomUUID().slice(0, 8);
    } while (this.rooms.has(roomId));

    const room = new Room(roomId, config, blueTeamName, redTeamName);
    this.rooms.set(roomId, room);
    return room;
  }

  get(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  delete(roomId: string): void {
    this.cancelScheduledDelete(roomId);
    const room = this.rooms.get(roomId);
    if (room) {
      room.destroy();
      this.rooms.delete(roomId);
    }
  }

  /** Delete the room after a grace period unless something joins first. */
  scheduleDelete(roomId: string, delayMs?: number): void {
    if (this.pendingDeletions.has(roomId)) return;
    const effective = delayMs ?? this.graceMs;
    const timer = setTimeout(() => {
      this.pendingDeletions.delete(roomId);
      const room = this.rooms.get(roomId);
      // Only actually delete if still empty — a late rejoin should have canceled.
      if (room && room.getTotalSockets() === 0) {
        room.destroy();
        this.rooms.delete(roomId);
      }
    }, effective);
    // Don't keep the event loop alive for pending cleanups in tests/shutdown.
    timer.unref?.();
    this.pendingDeletions.set(roomId, timer);
  }

  cancelScheduledDelete(roomId: string): void {
    const timer = this.pendingDeletions.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.pendingDeletions.delete(roomId);
    }
  }

  size(): number {
    return this.rooms.size;
  }
}

/** Singleton registry */
export const registry = new RoomRegistry();
