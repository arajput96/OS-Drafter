"use client";

import { useState } from "react";
import type { DraftConfig } from "@os-drafter/shared";
import { MAPS } from "@os-drafter/shared";
import { Button } from "@/components/ui/button";
import { createRoom, type CreateRoomResponse } from "@/lib/api";
import { SelectField, NumberField, RoomLinks } from "./form-fields";

const activeMaps = MAPS.filter((m) => m.active);

const MAP_OPTIONS = activeMaps.map((m) => ({
  value: m.name,
  label: m.name,
}));

export function CharacterDraftForm() {
  const [selectedMapName, setSelectedMapName] = useState(activeMaps[0]?.name ?? "");
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateRoomResponse | null>(null);

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
      };
      const res = await createRoom(config);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return <RoomLinks result={result} blueLabel="Blue" redLabel="Red" />;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-xl border border-border bg-card p-6 flex flex-col gap-5"
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

      <NumberField
        label="Timer (seconds)"
        value={timerSeconds}
        min={5}
        max={120}
        onChange={setTimerSeconds}
      />

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <Button
        type="submit"
        disabled={loading || !selectedMapName}
        size="lg"
        className="w-full"
      >
        {loading ? "Creating..." : "Create Room"}
      </Button>
    </form>
  );
}
