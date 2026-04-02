"use client";

import { useState } from "react";
import type { DraftConfig, MapBanMode } from "@os-drafter/shared";
import { MAPS } from "@os-drafter/shared";
import { Button } from "@/components/ui/button";
import { createRoom, type CreateRoomResponse } from "@/lib/api";
import { SelectField, NumberField, RoomLinks } from "./form-fields";

const MAP_BAN_MODES: { value: MapBanMode; label: string }[] = [
  { value: "bo1", label: "Best of 1" },
  { value: "bo3", label: "Best of 3" },
];

export function MapDraftForm() {
  const [config, setConfig] = useState({
    mapBanMode: "bo3" as MapBanMode,
    timerSeconds: 30,
    excludedMaps: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateRoomResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const fullConfig: DraftConfig = {
        draftType: "map",
        mapBanMode: config.mapBanMode,
        blueMapRole: "side_select",
        excludedMaps: config.excludedMaps,
        timerSeconds: config.timerSeconds,
        // Character fields — defaults (not used for map drafts)
        draftMode: "snake",
        banMode: "simultaneous",
        mirrorRule: "no_mirrors",
        numBans: 0,
        numPicks: 1,
      };
      const res = await createRoom(fullConfig);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return <RoomLinks result={result} blueLabel="Side Select" redLabel="Map Select" />;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-xl border border-border bg-card p-6 flex flex-col gap-5"
    >
      <h2 className="text-center text-xl font-bold text-primary">
        Map Draft
      </h2>

      <SelectField
        label="Series Format"
        value={config.mapBanMode}
        options={MAP_BAN_MODES}
        onChange={(v) => setConfig({ ...config, mapBanMode: v as MapBanMode })}
      />

      <MapExclusionPicker
        excludedMaps={config.excludedMaps}
        onChange={(excluded) => setConfig({ ...config, excludedMaps: excluded })}
      />

      <NumberField
        label="Timer (seconds)"
        value={config.timerSeconds}
        min={5}
        max={120}
        onChange={(v) => setConfig({ ...config, timerSeconds: v })}
      />

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <Button
        type="submit"
        disabled={loading || config.excludedMaps.length !== 3}
        size="lg"
        className="w-full"
      >
        {loading ? "Creating..." : "Create Room"}
      </Button>
    </form>
  );
}

function MapExclusionPicker({
  excludedMaps,
  onChange,
}: {
  excludedMaps: string[];
  onChange: (excluded: string[]) => void;
}) {
  const activeMaps = MAPS.filter((m) => m.active);
  const excluded = new Set(excludedMaps);

  const toggle = (mapId: string) => {
    if (excluded.has(mapId)) {
      onChange(excludedMaps.filter((id) => id !== mapId));
    } else if (excluded.size < 3) {
      onChange([...excludedMaps, mapId]);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        Exclude Maps ({excluded.size}/3)
      </label>
      <div className="grid grid-cols-2 gap-2">
        {activeMaps.map((map) => {
          const isExcluded = excluded.has(map.id);
          const isDisabled = !isExcluded && excluded.size >= 3;
          return (
            <button
              key={map.id}
              type="button"
              disabled={isDisabled}
              aria-pressed={isExcluded}
              onClick={() => toggle(map.id)}
              className={`rounded-lg border px-3 py-2 text-xs text-left transition-colors ${
                isExcluded
                  ? "border-destructive bg-destructive/10 text-destructive line-through"
                  : "border-border bg-input text-foreground hover:bg-secondary"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {map.name}
            </button>
          );
        })}
      </div>
      {excluded.size !== 3 && (
        <p className="text-xs text-muted-foreground">
          Select exactly 3 maps to exclude
        </p>
      )}
    </div>
  );
}
