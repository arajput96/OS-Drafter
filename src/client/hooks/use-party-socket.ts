import { useEffect, useRef, useCallback } from "react";
import PartySocket from "partysocket";
import type { RoomRole, ServerMessage, ClientMessage } from "@shared/types";
import { NO_BAN } from "@shared/types";
import { useDraftStore } from "@/store/draft-store";

export function getPartyHost(): string {
  if (import.meta.env.VITE_PARTYKIT_HOST) {
    return import.meta.env.VITE_PARTYKIT_HOST;
  }
  if (import.meta.env.DEV) {
    return "localhost:1999";
  }
  return window.location.host;
}

export function usePartySocket(roomId: string, role: RoomRole) {
  const socketRef = useRef<PartySocket | null>(null);

  useEffect(() => {
    useDraftStore.getState().setRole(role);

    const socket = new PartySocket({
      host: getPartyHost(),
      room: roomId,
      query: { role },
    });
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      useDraftStore.getState().setConnected(true);
    });

    socket.addEventListener("close", () => {
      useDraftStore.getState().setConnected(false);
    });

    socket.addEventListener("message", (event) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      const store = useDraftStore.getState();
      switch (msg.type) {
        case "room:state":
          store.setRoom(msg.state);
          break;
        case "draft:state":
          store.setDraft(msg.state);
          break;
        case "draft:timer":
          store.setTimer(msg.remaining);
          break;
        case "error":
          store.setError(msg.message);
          break;
      }
    });

    return () => {
      socket.close();
      useDraftStore.getState().reset();
    };
  }, [roomId, role]);

  const sendMessage = useCallback((msg: ClientMessage) => {
    socketRef.current?.send(JSON.stringify(msg));
  }, []);

  const startDraft = useCallback(() => {
    sendMessage({ type: "draft:start" });
  }, [sendMessage]);

  const banMap = useCallback((mapId: string) => {
    sendMessage({ type: "draft:ban-map", mapId });
  }, [sendMessage]);

  const pickMap = useCallback((mapId: string) => {
    sendMessage({ type: "draft:pick-map", mapId });
  }, [sendMessage]);

  const selectCharacter = useCallback((characterId: string) => {
    useDraftStore.getState().setSelected(characterId);
    sendMessage({ type: "draft:select", characterId });
  }, [sendMessage]);

  const lockIn = useCallback(() => {
    sendMessage({ type: "draft:lock" });
    useDraftStore.getState().setSelected(null);
  }, [sendMessage]);

  const skipBan = useCallback(() => {
    useDraftStore.getState().setSelected(NO_BAN);
    sendMessage({ type: "draft:select", characterId: NO_BAN });
    sendMessage({ type: "draft:lock" });
    useDraftStore.getState().setSelected(null);
  }, [sendMessage]);

  return { startDraft, banMap, pickMap, selectCharacter, lockIn, skipBan };
}
