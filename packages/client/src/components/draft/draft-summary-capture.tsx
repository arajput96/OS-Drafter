"use client";

import { forwardRef } from "react";
import type { DraftState, RoomState } from "@os-drafter/shared";
import { CHARACTERS, AWAKENINGS, MAPS } from "@os-drafter/shared";

const characterMap = new Map(CHARACTERS.map((c) => [c.id, c]));
const awakeningMap = new Map(AWAKENINGS.map((a) => [a.id, a]));
const mapMap = new Map(MAPS.map((m) => [m.id, m]));

interface DraftSummaryCaptureProps {
  draft: DraftState;
  room: RoomState;
}

/**
 * Offscreen-rendered draft summary for image capture.
 * Uses <img> tags (not Next.js Image) so html-to-image can capture reliably.
 */
export const DraftSummaryCapture = forwardRef<HTMLDivElement, DraftSummaryCaptureProps>(
  function DraftSummaryCapture({ draft, room }, ref) {
    const isMapDraft = draft.config.draftType === "map";

    if (isMapDraft) {
      return <MapSummary ref={ref} draft={draft} />;
    }

    return <CharacterSummary ref={ref} draft={draft} room={room} />;
  },
);

/* ---------- Character draft summary ---------- */

const CharacterSummary = forwardRef<HTMLDivElement, DraftSummaryCaptureProps>(
  function CharacterSummary({ draft, room }, ref) {
    const awakenings = room.revealedAwakenings;

    return (
      <div
        ref={ref}
        className="flex w-[720px] flex-col items-center gap-5 rounded-xl bg-[#0d0d12] p-8"
      >
        <h2 className="text-2xl font-bold text-[#3b82f6]">Draft Results</h2>

        {draft.config.selectedMapName && (
          <div className="text-center">
            <p className="text-xs text-[#9090a0]">Map</p>
            <p className="text-lg font-semibold text-white">{draft.config.selectedMapName}</p>
          </div>
        )}

        {awakenings && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-[#9090a0]">Starting Awakenings:</span>
            <div className="flex gap-3">
              {awakenings.map((id) => {
                const awk = awakeningMap.get(id);
                if (!awk) return null;
                return (
                  <div
                    key={id}
                    className="flex flex-col items-center gap-1 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#222230]/50 px-3 py-1.5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={awk.icon} alt={awk.name} className="size-9 rounded object-cover" />
                    <span className="text-xs font-medium text-white">{awk.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex w-full gap-6">
          <TeamColumn team="blue" bans={draft.blueTeamBans} picks={draft.blueTeamPicks} />
          <TeamColumn team="red" bans={draft.redTeamBans} picks={draft.redTeamPicks} />
        </div>

        <p className="text-xs text-[#9090a0]/60">OS Drafter</p>
      </div>
    );
  },
);

/* ---------- Map draft summary ---------- */

const MapSummary = forwardRef<HTMLDivElement, { draft: DraftState }>(
  function MapSummary({ draft }, ref) {
    const isBo3 = draft.config.mapBanMode === "bo3";
    const selectedMap = draft.mapBans.selectedMap
      ? mapMap.get(draft.mapBans.selectedMap) ?? null
      : null;

    return (
      <div
        ref={ref}
        className="flex w-[720px] flex-col items-center gap-5 rounded-xl bg-[#0d0d12] p-8"
      >
        <h2 className="text-2xl font-bold text-[#3b82f6]">Map Draft Results</h2>

        {isBo3 ? (
          <div className="flex w-full max-w-sm flex-col gap-3">
            {draft.mapBans.gameOrder.map((mapId, i) => {
              const map = mapId ? mapMap.get(mapId) ?? null : null;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#222230]/50 px-4 py-3"
                >
                  <span className="text-sm font-medium text-[#9090a0]">Game {i + 1}</span>
                  <span className="text-sm font-semibold text-white">{map?.name ?? "---"}</span>
                </div>
              );
            })}
          </div>
        ) : (
          selectedMap && (
            <div className="text-center">
              <p className="text-xs text-[#9090a0]">Selected Map</p>
              <p className="text-lg font-semibold text-white">{selectedMap.name}</p>
            </div>
          )
        )}

        <p className="text-xs text-[#9090a0]/60">OS Drafter</p>
      </div>
    );
  },
);

/* ---------- Shared team column ---------- */

function TeamColumn({
  team,
  bans,
  picks,
}: {
  team: "blue" | "red";
  bans: (string | null)[];
  picks: (string | null)[];
}) {
  const isBlue = team === "blue";
  const teamColor = isBlue ? "#3b82f6" : "#ef4444";
  const teamBg = isBlue ? "rgba(59,130,246,0.05)" : "rgba(239,68,68,0.05)";
  const teamBorder = isBlue ? "rgba(59,130,246,0.2)" : "rgba(239,68,68,0.2)";
  const pickBorder = isBlue ? "rgba(59,130,246,0.3)" : "rgba(239,68,68,0.3)";
  const pickBg = isBlue ? "rgba(59,130,246,0.05)" : "rgba(239,68,68,0.05)";

  return (
    <div
      className="flex flex-1 flex-col gap-3 rounded-xl border p-3"
      style={{ borderColor: teamBorder, backgroundColor: teamBg }}
    >
      <div
        className="text-center text-sm font-bold uppercase tracking-wider"
        style={{ color: teamColor }}
      >
        {isBlue ? "Blue" : "Red"}
      </div>

      {/* Bans */}
      {bans.length > 0 && (
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wider text-[#9090a0]">Bans</div>
          <div className="flex flex-col gap-1.5">
            {bans.map((id, i) => (
              <SlotRow key={i} characterId={id} type="ban" pickBorder={pickBorder} pickBg={pickBg} />
            ))}
          </div>
        </div>
      )}

      {/* Picks */}
      <div>
        <div className="mb-1 text-[10px] uppercase tracking-wider text-[#9090a0]">Picks</div>
        <div className="flex flex-col gap-1.5">
          {picks.map((id, i) => (
            <SlotRow key={i} characterId={id} type="pick" pickBorder={pickBorder} pickBg={pickBg} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SlotRow({
  characterId,
  type,
  pickBorder,
  pickBg,
}: {
  characterId: string | null;
  type: "ban" | "pick";
  pickBorder: string;
  pickBg: string;
}) {
  const character = characterId ? characterMap.get(characterId) : null;
  const isBan = type === "ban";

  return (
    <div
      className="flex h-14 w-full items-center gap-2 rounded-lg border px-2"
      style={{
        borderColor: isBan ? "rgba(255,255,255,0.04)" : pickBorder,
        backgroundColor: isBan ? "rgba(34,34,48,0.3)" : pickBg,
      }}
    >
      {character ? (
        <>
          <div className="relative size-10 shrink-0 overflow-hidden rounded-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={character.icon}
              alt={character.name}
              className={`size-full object-cover ${isBan ? "grayscale" : ""}`}
            />
            {isBan && (
              <div className="absolute bottom-0 right-0 flex size-4 items-center justify-center rounded-tl-sm bg-[#dc2626]/80">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={4} className="size-2.5">
                  <line x1="4" y1="4" x2="20" y2="20" />
                  <line x1="20" y1="4" x2="4" y2="20" />
                </svg>
              </div>
            )}
          </div>
          <span className={`text-sm font-medium truncate ${isBan ? "text-[#9090a0]" : "text-white"}`}>
            {character.name}
          </span>
        </>
      ) : (
        <span className="text-xs text-[#9090a0]">{isBan ? "Ban" : "Pick"}</span>
      )}
    </div>
  );
}
