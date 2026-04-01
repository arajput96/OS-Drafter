import { Room } from "./Room.js";
import type { DraftConfig } from "@os-drafter/shared";

/** In-memory room storage. Rooms are ephemeral (no database for MVP). */
class RoomRegistry {
  private rooms = new Map<string, Room>();

  create(config: DraftConfig): Room {
    const roomId = crypto.randomUUID().slice(0, 8);
    const room = new Room(roomId, config);
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
