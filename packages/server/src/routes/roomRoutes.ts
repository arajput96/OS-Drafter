import type { FastifyInstance } from "fastify";
import type { DraftConfig } from "@os-drafter/shared";
import { registry } from "../RoomRegistry.js";
import { draftConfigSchema, validateDraftConfig, normalizeTeamName } from "../validation.js";

export function registerRoomRoutes(app: FastifyInstance, clientOrigin: string): void {
  app.post<{ Body: DraftConfig & { blueTeamName?: string; redTeamName?: string } }>(
    "/rooms",
    { schema: { body: draftConfigSchema } },
    async (_request, reply) => {
      const { blueTeamName, redTeamName, ...config } = _request.body;

      const validationError = validateDraftConfig({ ...config, blueTeamName, redTeamName });
      if (validationError) {
        return reply.status(400).send({ error: validationError });
      }

      const room = registry.create(
        config,
        normalizeTeamName(blueTeamName),
        normalizeTeamName(redTeamName),
      );

      return reply.status(201).send({
        roomId: room.roomId,
        blueUrl: `${clientOrigin}/room/${room.roomId}?role=blue`,
        redUrl: `${clientOrigin}/room/${room.roomId}?role=red`,
        spectatorUrl: `${clientOrigin}/room/${room.roomId}?role=spectator`,
        overlayUrl: `${clientOrigin}/room/${room.roomId}/overlay`,
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
