"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MAPS, AWAKENINGS } from "@os-drafter/shared";
import type { DraftState, RoomState, Team } from "@os-drafter/shared";
import { characterMap, getCharacterSplashPath } from "@/lib/character-utils";

interface CharacterDraftOverlayV2Props {
  draft: DraftState;
  room: RoomState;
  timerRemaining: number;
  /** Tentative selections broadcast to spectators (null per team if none). */
  tentative: { blue: string | null; red: string | null };
}

const mapLookup = new Map(MAPS.map((m) => [m.name, m]));
const awakeningMap = new Map(AWAKENINGS.map((a) => [a.id, a]));

type SlotKind = "ban" | "pick";

interface SlotSpec {
  kind: SlotKind;
  index: number;
  label: string;
}

// Taller slots — more vertical presence for broadcast.
const PICK_W = 132;
const PICK_H = 196;
const BAN_W = 102;
const BAN_H = 148;

function buildSlots(numBans: number, numPicks: number): SlotSpec[] {
  const slots: SlotSpec[] = [];
  for (let i = 0; i < numBans; i++) {
    slots.push({ kind: "ban", index: i, label: numBans > 1 ? `BAN ${i + 1}` : "BAN" });
  }
  for (let i = 0; i < numPicks; i++) {
    slots.push({ kind: "pick", index: i, label: `PICK ${i + 1}` });
  }
  return slots;
}

function isSlotActive(
  draft: DraftState,
  team: Team,
  slot: SlotSpec,
): boolean {
  const step = draft.turnOrder[draft.turnIndex];
  if (!step) return false;
  if (step.type !== slot.kind) return false;
  if (step.index !== slot.index) return false;
  if (step.team === "both") return true;
  return step.team === team;
}

function getSlotValue(
  draft: DraftState,
  team: Team,
  slot: SlotSpec,
): { characterId: string | null; noBan: boolean; filled: boolean } {
  if (slot.kind === "ban") {
    const bans = team === "blue" ? draft.blueTeamBans : draft.redTeamBans;
    if (bans.length <= slot.index) {
      return { characterId: null, noBan: false, filled: false };
    }
    const value = bans[slot.index];
    if (value === null) return { characterId: null, noBan: true, filled: true };
    return { characterId: value ?? null, noBan: false, filled: !!value };
  }
  const picks = team === "blue" ? draft.blueTeamPicks : draft.redTeamPicks;
  const value = picks[slot.index] ?? null;
  return { characterId: value, noBan: false, filled: !!value };
}

interface SlotProps {
  team: Team;
  slot: SlotSpec;
  characterId: string | null;
  noBan: boolean;
  filled: boolean;
  active: boolean;
  /** Character this team is hovering before locking — only rendered on active empty slots. */
  tentativeId: string | null;
}

function PortraitSlot({
  team,
  slot,
  characterId,
  noBan,
  filled,
  active,
  tentativeId,
}: SlotProps) {
  const character = characterId ? characterMap.get(characterId) : null;
  const previewCharacter =
    !filled && active && tentativeId ? characterMap.get(tentativeId) : null;
  const teamColor = team === "blue" ? "var(--overlay-blue)" : "var(--overlay-red)";
  const isBan = slot.kind === "ban";
  const width = isBan ? BAN_W : PICK_W;
  const height = isBan ? BAN_H : PICK_H;

  const borderColor = filled
    ? isBan
      ? "rgba(255,255,255,0.22)"
      : teamColor
    : active
      ? teamColor
      : "rgba(255,255,255,0.15)";

  // Team gradient (filled picks) + ban treatment + empty fallback
  const gradient = isBan
    ? "linear-gradient(135deg, rgba(30,30,36,1) 0%, rgba(20,20,24,0.6) 100%)"
    : team === "blue"
      ? "linear-gradient(135deg, rgba(0,191,255,0.35) 0%, rgba(0,191,255,0.08) 100%)"
      : "linear-gradient(135deg, rgba(255,45,120,0.35) 0%, rgba(255,45,120,0.08) 100%)";
  const emptyBg = active
    ? team === "blue"
      ? "linear-gradient(180deg, rgba(0,191,255,0.14), rgba(0,191,255,0.03))"
      : "linear-gradient(180deg, rgba(255,45,120,0.14), rgba(255,45,120,0.03))"
    : "rgba(255,255,255,0.035)";

  // Splash drop-shadow glow uses team color at low alpha
  const splashGlow =
    team === "blue"
      ? "drop-shadow(0 0 8px rgba(0,191,255,0.55))"
      : "drop-shadow(0 0 8px rgba(255,45,120,0.55))";

  return (
    <div className="flex flex-col items-center gap-1.5" style={{ width }}>
      <motion.div
        className="relative overflow-hidden rounded-lg"
        style={{
          width,
          height,
          border: `3px solid ${borderColor}`,
          background: filled || previewCharacter ? gradient : emptyBg,
        }}
        animate={
          active && !filled
            ? {
                boxShadow: [
                  `0 0 0 2px ${teamColor}, 0 0 12px ${teamColor}66`,
                  `0 0 0 2px ${teamColor}, 0 0 28px ${teamColor}cc`,
                  `0 0 0 2px ${teamColor}, 0 0 12px ${teamColor}66`,
                ],
              }
            : { boxShadow: "0 0 0 0px rgba(0,0,0,0)" }
        }
        transition={
          active && !filled
            ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.2 }
        }
      >
        <AnimatePresence mode="wait">
          {character ? (
            <motion.img
              key={`locked-${character.id}`}
              src={getCharacterSplashPath(character.name)}
              alt={character.name}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "50% 20%",
                transform: "scale(1.1)",
                filter: isBan
                  ? "grayscale(1) brightness(0.55)"
                  : `brightness(1.1) ${splashGlow}`,
              }}
              initial={{ scale: 1.2, opacity: 0, y: 6 }}
              animate={{ scale: 1.1, opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
            />
          ) : previewCharacter ? (
            <motion.img
              key={`preview-${previewCharacter.id}`}
              src={getCharacterSplashPath(previewCharacter.name)}
              alt={previewCharacter.name}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "50% 20%",
                transform: "scale(1.1)",
                filter: `brightness(0.9) ${splashGlow}`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            />
          ) : noBan ? (
            <motion.img
              key="no-ban"
              src="/assets/no-ban.svg"
              alt="No Ban"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                padding: 22,
                opacity: 0.7,
              }}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
            />
          ) : null}
        </AnimatePresence>

        {/* Vignette — darkens edges, brightens center for a card-like feel */}
        {(character || previewCharacter) && (
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: "inset 0 0 36px 14px rgba(0,0,0,0.72)",
            }}
          />
        )}

        {/* Ban black-wash + crossbar */}
        {isBan && filled && !noBan && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: "rgba(0,0,0,0.35)" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <div
                style={{
                  width: "130%",
                  height: 4,
                  background: teamColor,
                  transform: "rotate(-18deg)",
                  boxShadow: "0 0 8px rgba(0,0,0,0.9)",
                }}
              />
            </div>
          </>
        )}

        {/* Empty placeholder (no character, no preview) */}
        {!character && !previewCharacter && !noBan && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-bold"
              style={{
                fontSize: isBan ? 26 : 32,
                color: active ? teamColor : "rgba(255,255,255,0.18)",
                textShadow: "0 1px 4px rgba(0,0,0,0.8)",
              }}
            >
              ?
            </span>
          </div>
        )}

        {/* Character name strip */}
        {(character || previewCharacter) && (
          <div
            className="absolute bottom-0 left-0 right-0 text-center"
            style={{
              padding: "16px 6px 5px",
              background:
                "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.92) 70%)",
            }}
          >
            <span
              className="text-[11px] font-extrabold uppercase tracking-wide block"
              style={{
                color: "#fff",
                textShadow: "0 1px 4px rgba(0,0,0,1)",
                opacity: previewCharacter ? 0.85 : 1,
                // Allow long names to shrink to fit instead of truncating
                whiteSpace: "nowrap",
                overflow: "visible",
              }}
            >
              {(character ?? previewCharacter)!.name}
            </span>
          </div>
        )}
      </motion.div>

      {/* Slot-type label — always rendered so filled and empty slots are the same height. */}
      <span
        className="text-[10px] font-bold uppercase tracking-wider"
        style={{
          color: active ? teamColor : "rgba(255,255,255,0.5)",
          textShadow: "0 1px 4px rgba(0,0,0,0.8)",
        }}
      >
        {slot.label}
      </span>
    </div>
  );
}

interface TeamSideProps {
  team: Team;
  draft: DraftState;
  slots: SlotSpec[];
  tentativeId: string | null;
  reverse: boolean;
}

function TeamSide({ team, draft, slots, tentativeId, reverse }: TeamSideProps) {
  const ordered = reverse ? [...slots].reverse() : slots;
  return (
    <div className="flex items-end gap-2.5">
      {ordered.map((slot) => {
        const { characterId, noBan, filled } = getSlotValue(draft, team, slot);
        const active = isSlotActive(draft, team, slot) && !filled;
        return (
          <PortraitSlot
            key={`${slot.kind}-${slot.index}`}
            team={team}
            slot={slot}
            characterId={characterId}
            noBan={noBan}
            filled={filled}
            active={active}
            tentativeId={tentativeId}
          />
        );
      })}
    </div>
  );
}

interface CenterPanelProps {
  blueName: string;
  redName: string;
  mapIcon: string | null;
  mapName: string | null;
  awakeningIcons: { id: string; icon: string; name: string }[];
  timerRemaining: number;
  timerTotal: number;
  phase: string;
}

function CenterPanel({
  blueName,
  redName,
  mapIcon,
  mapName,
  awakeningIcons,
  timerRemaining,
  timerTotal,
  phase,
}: CenterPanelProps) {
  const pct =
    timerTotal > 0 ? Math.max(0, Math.min(1, timerRemaining / timerTotal)) : 0;
  const danger = timerRemaining > 0 && timerRemaining <= 5;

  return (
    <motion.div
      key={phase}
      initial={{ scale: 0.98, opacity: 0.85 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="flex flex-col items-center shrink-0"
      style={{
        width: 300,
        minHeight: PICK_H + 22,
        padding: "8px 14px",
        gap: 10,
        borderLeft: "1px solid rgba(255,255,255,0.12)",
        borderRight: "1px solid rgba(255,255,255,0.12)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 100%)",
      }}
    >
      {/* Team names */}
      <div className="flex items-center justify-center gap-2 w-full">
        <span
          className="text-base font-extrabold uppercase tracking-wider truncate text-right flex-1"
          style={{
            color: "var(--overlay-blue)",
            textShadow: "0 1px 4px rgba(0,0,0,0.9)",
          }}
          title={blueName}
        >
          {blueName}
        </span>
        <span
          className="text-[11px] font-bold uppercase"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          vs
        </span>
        <span
          className="text-base font-extrabold uppercase tracking-wider truncate text-left flex-1"
          style={{
            color: "var(--overlay-red)",
            textShadow: "0 1px 4px rgba(0,0,0,0.9)",
          }}
          title={redName}
        >
          {redName}
        </span>
      </div>

      {/* Map mini */}
      {mapIcon ? (
        <div
          className="relative overflow-hidden rounded-md"
          style={{
            width: 256,
            height: 92,
            border: "1px solid rgba(255,255,255,0.22)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mapIcon}
            alt={mapName ?? "Map"}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
          {mapName && (
            <div
              className="absolute bottom-0 left-0 right-0 text-center text-[10px] font-bold uppercase tracking-wider"
              style={{
                color: "#fff",
                background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.88))",
                padding: "10px 4px 3px",
                textShadow: "0 1px 2px rgba(0,0,0,1)",
              }}
            >
              {mapName}
            </div>
          )}
        </div>
      ) : (
        <div style={{ height: 92 }} />
      )}

      {/* Awakenings row */}
      <div
        className="flex items-center justify-center gap-2.5"
        style={{ minHeight: 44 }}
      >
        {awakeningIcons.map((awk) => (
          <div
            key={awk.id}
            className="overflow-hidden rounded-md"
            style={{
              width: 44,
              height: 44,
              border: "1px solid rgba(255,255,255,0.3)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.6)",
            }}
            title={awk.name}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={awk.icon}
              alt={awk.name}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          </div>
        ))}
      </div>

      {/* Timer bar */}
      <div className="w-full flex flex-col items-center gap-1 mt-auto">
        <span
          className="text-sm font-extrabold tabular-nums"
          style={{
            color: danger ? "#ff5577" : "rgba(255,255,255,0.85)",
            textShadow: "0 1px 3px rgba(0,0,0,0.9)",
          }}
        >
          {timerRemaining}s
        </span>
        <div
          className="w-full overflow-hidden rounded-full"
          style={{
            height: 6,
            background: "rgba(255,255,255,0.1)",
          }}
        >
          <motion.div
            style={{
              height: "100%",
              background: danger
                ? "linear-gradient(90deg, #ff2d78, #ff6666)"
                : "linear-gradient(90deg, var(--overlay-blue), var(--overlay-red))",
            }}
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 0.95, ease: "linear" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function CharacterDraftOverlayV2({
  draft,
  room,
  timerRemaining,
  tentative,
}: CharacterDraftOverlayV2Props) {
  const blueName = room.blueTeamName || "BLUE";
  const redName = room.redTeamName || "RED";

  const selectedMap = draft.config.selectedMapName
    ? mapLookup.get(draft.config.selectedMapName)
    : null;

  const awakeningIcons = room.revealedAwakenings
    ? room.revealedAwakenings
        .map((id) => awakeningMap.get(id))
        .filter((a): a is NonNullable<typeof a> => !!a)
        .map((a) => ({ id: a.id, icon: a.icon, name: a.name }))
    : [];

  const slots = buildSlots(draft.config.numBans, draft.config.numPicks);

  return (
    <div className="flex items-end justify-center w-full gap-3">
      <TeamSide
        team="blue"
        draft={draft}
        slots={slots}
        tentativeId={tentative.blue}
        reverse
      />
      <CenterPanel
        blueName={blueName}
        redName={redName}
        mapIcon={selectedMap?.icon ?? null}
        mapName={selectedMap?.name ?? null}
        awakeningIcons={awakeningIcons}
        timerRemaining={timerRemaining}
        timerTotal={draft.config.timerSeconds}
        phase={draft.phase}
      />
      <TeamSide
        team="red"
        draft={draft}
        slots={slots}
        tentativeId={tentative.red}
        reverse={false}
      />
    </div>
  );
}
