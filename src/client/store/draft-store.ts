import { create } from "zustand";
import type { DraftState, RoomRole, RoomState } from "@shared/types";

interface DraftStore {
  connected: boolean;
  role: RoomRole | null;
  room: RoomState | null;
  draft: DraftState | null;
  timerRemaining: number;
  selectedId: string | null;
  error: string | null;

  setConnected: (connected: boolean) => void;
  setRole: (role: RoomRole) => void;
  setRoom: (room: RoomState) => void;
  setDraft: (draft: DraftState) => void;
  setTimer: (remaining: number) => void;
  setSelected: (id: string | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  connected: false,
  role: null as RoomRole | null,
  room: null as RoomState | null,
  draft: null as DraftState | null,
  timerRemaining: 0,
  selectedId: null as string | null,
  error: null as string | null,
};

export const useDraftStore = create<DraftStore>((set) => ({
  ...initialState,
  setConnected: (connected) => set({ connected }),
  setRole: (role) => set({ role }),
  setRoom: (room) => set({ room }),
  setDraft: (draft) =>
    set((state) => {
      const turnAdvanced = state.draft && draft && state.draft.turnIndex !== draft.turnIndex;
      return { draft, ...(turnAdvanced ? { selectedId: null } : {}) };
    }),
  setTimer: (timerRemaining) => set({ timerRemaining }),
  setSelected: (selectedId) => set({ selectedId }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
