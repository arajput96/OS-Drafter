import type { DraftConfig, CreateRoomResponse } from "@shared/types";
import { getPartyHost } from "../hooks/use-party-socket";

export async function createRoom(
  config: DraftConfig,
  teamNames?: { blueTeamName?: string; redTeamName?: string },
): Promise<CreateRoomResponse> {
  const roomId = crypto.randomUUID().slice(0, 8);
  const host = getPartyHost();
  const protocol = host.startsWith("localhost") ? "http" : "https";

  const res = await fetch(`${protocol}://${host}/parties/main/${roomId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...config, ...teamNames }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to create room (${res.status})`);
  }

  return res.json();
}
