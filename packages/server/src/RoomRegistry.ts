import { Room } from "./Room.js";
import type { DraftConfig } from "@os-drafter/shared";

/**
 * In-memory room storage. Rooms are ephemeral (no database for MVP).
 *
 * TODO: Add TTL-based eviction (createdAt + periodic sweep) and a max room
 * limit or rate limiting on creation to prevent memory leaks from abandoned
 * rooms and DoS via mass room creation.
 */
class RoomRegistry {
  private rooms = new Map<string, Room>();

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
    const room = this.rooms.get(roomId);
    if (room) {
      room.destroy();
      this.rooms.delete(roomId);
    }
  }

  size(): number {
    return this.rooms.size;
  }
}

/** Singleton registry */
export const registry = new RoomRegistry();
