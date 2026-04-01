import type { FastifyInstance } from "fastify";
import type { DraftConfig } from "@os-drafter/shared";
import { registry } from "../RoomRegistry.js";
import { draftConfigSchema } from "../validation.js";

export function registerRoomRoutes(app: FastifyInstance, clientOrigin: string): void {
  app.post<{ Body: DraftConfig }>(
    "/rooms",
    { schema: { body: draftConfigSchema } },
    async (_request, reply) => {
      const config = _request.body;

      const room = registry.create(config);

      return reply.status(201).send({
        roomId: room.roomId,
        blueUrl: `${clientOrigin}/room/${room.roomId}?role=blue`,
        redUrl: `${clientOrigin}/room/${room.roomId}?role=red`,
        spectatorUrl: `${clientOrigin}/room/${room.roomId}?role=spectator`,
      });
    },
  );

  app.get<{ Params: { id: string } }>("/rooms/:id", async (request, reply) => {
    const room = registry.get(request.params.id);

    if (!room) {
      return reply.status(404).send({ error: "Room not found" });
    }

    return room.getRoomState();
  });
}
