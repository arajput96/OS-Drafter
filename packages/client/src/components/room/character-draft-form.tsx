"use client";

import { useState } from "react";
import type { DraftConfig } from "@os-drafter/shared";
import { MAPS, DEFAULT_EXCLUDED_AWAKENINGS } from "@os-drafter/shared";
import { Button } from "@/components/ui/button";
import { createRoom, type CreateRoomResponse } from "@/lib/api";
import { SelectField, NumberField, RoomLinks } from "./form-fields";
import { AwakeningPickerDialog } from "@/components/home/awakening-picker-dialog";

const activeMaps = MAPS.filter((m) => m.active);

const MAP_OPTIONS = activeMaps.map((m) => ({
  value: m.name,
  label: m.name,
}));

export function CharacterDraftForm() {
  const [selectedMapName, setSelectedMapName] = useState(activeMaps[0]?.name ?? "");
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [blueTeamName, setBlueTeamName] = useState("");
  const [redTeamName, setRedTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateRoomResponse | null>(null);
  const [awakeningMode, setAwakeningMode] = useState<"random" | "choose">("random");
  // Default exclusions come from shared so the id list is validated against the
  // current awakening pool at build time.
  const [excludedAwakenings, setExcludedAwakenings] = useState<string[]>([
    ...DEFAULT_EXCLUDED_AWAKENINGS,
  ]);
  const [chosenAwakenings, setChosenAwakenings] = useState<[string, string] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const config: DraftConfig = {
        draftType: "character",
        selectedMapName,
        timerSeconds,
        draftMode: "snake",
        banMode: "staggered",
        mirrorRule: "no_mirrors",
        numBans: 1,
        numPicks: 3,
        // Map fields — defaults (not used for character drafts)
        mapBanMode: "bo1",
        blueMapRole: "side_select",
        excludedMaps: [],
        ...(awakeningMode === "choose" && chosenAwakenings
          ? { chosenAwakenings }
          : excludedAwakenings.length > 0
            ? { excludedAwakenings }
            : {}),
      };
      const res = await createRoom(config, {
        blueTeamName: blueTeamName || undefined,
        redTeamName: redTeamName || undefined,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setSelectedMapName(activeMaps[0]?.name ?? "");
    setTimerSeconds(30);
    setBlueTeamName("");
    setRedTeamName("");
    setError(null);
    setAwakeningMode("random");
    setExcludedAwakenings([]);
    setChosenAwakenings(null);
  };

  if (result) {
    return <RoomLinks result={result} blueLabel={blueTeamName || "Blue"} redLabel={redTeamName || "Red"} onReset={handleReset} />;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-xl border border-border bg-card p-6 flex flex-col gap-5 card-glow"
    >
      <h2 className="text-center text-xl font-bold text-primary">
        Character Draft
      </h2>

      <SelectField
        label="Map"
        value={selectedMapName}
        options={MAP_OPTIONS}
        onChange={setSelectedMapName}
      />

      <AwakeningPickerDialog
        mode={awakeningMode}
        onModeChange={setAwakeningMode}
        excludedAwakenings={excludedAwakenings}
        onExcludedChange={setExcludedAwakenings}
        chosenAwakenings={chosenAwakenings}
        onChosenChange={setChosenAwakenings}
      />

      <NumberField
        label="Timer (seconds)"
        value={timerSeconds}
        min={5}
        max={120}
        onChange={setTimerSeconds}
      />

      {/* Optional team names */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Team Names <span className="text-muted-foreground/60">(optional, max 4 chars)</span>
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            maxLength={4}
            placeholder="Blue"
            value={blueTeamName}
            onChange={(e) => setBlueTeamName(e.target.value.toUpperCase())}
            className="flex-1 rounded-lg border border-team-blue/30 bg-input px-3 py-2 text-sm text-team-blue placeholder:text-team-blue/40 outline-none focus:border-team-blue focus:ring-2 focus:ring-team-blue/30 uppercase"
          />
          <input
            type="text"
            maxLength={4}
            placeholder="Red"
            value={redTeamName}
            onChange={(e) => setRedTeamName(e.target.value.toUpperCase())}
            className="flex-1 rounded-lg border border-team-red/30 bg-input px-3 py-2 text-sm text-team-red placeholder:text-team-red/40 outline-none focus:border-team-red focus:ring-2 focus:ring-team-red/30 uppercase"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <Button
        type="submit"
        variant="gradient"
        disabled={loading || !selectedMapName || (awakeningMode === "choose" && !chosenAwakenings)}
        size="lg"
        className="w-full"
      >
        {loading ? "Creating..." : "Create Room"}
      </Button>
    </form>
  );
}
