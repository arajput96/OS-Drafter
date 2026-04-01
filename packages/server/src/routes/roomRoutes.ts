import type { FastifyInstance } from "fastify";
import type { DraftConfig } from "@os-drafter/shared";
import { registry } from "../RoomRegistry.js";

export function registerRoomRoutes(app: FastifyInstance, clientOrigin: string): void {
  app.post<{ Body: DraftConfig }>("/rooms", async (request, reply) => {
    const config = request.body as DraftConfig;

    if (!config || !config.draftMode || !config.banMode || !config.mirrorRule) {
      return reply.status(400).send({ error: "Invalid draft configuration" });
    }

    const room = registry.create(config);

    return reply.status(201).send({
      roomId: room.roomId,
      blueUrl: `${clientOrigin}/room/${room.roomId}?role=blue`,
      redUrl: `${clientOrigin}/room/${room.roomId}?role=red`,
      spectatorUrl: `${clientOrigin}/room/${room.roomId}?role=spectator`,
    });
  });

  app.get<{ Params: { id: string } }>("/rooms/:id", async (request, reply) => {
    const room = registry.get(request.params.id);

    if (!room) {
      return reply.status(404).send({ error: "Room not found" });
    }

    return room.getRoomState();
  });
}
