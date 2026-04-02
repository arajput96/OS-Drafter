"use client";

import { useState } from "react";
import type { DraftConfig, MapBanMode } from "@os-drafter/shared";
import { MAPS } from "@os-drafter/shared";
import { Button } from "@/components/ui/button";
import { createRoom, type CreateRoomResponse } from "@/lib/api";
import { Check, Copy } from "lucide-react";

const MAP_BAN_MODES: { value: MapBanMode; label: string }[] = [
  { value: "bo1", label: "Best of 1" },
  { value: "bo3", label: "Best of 3" },
];


export function RoomCreationForm() {
  const [config, setConfig] = useState<DraftConfig>({
    draftMode: "snake",
    banMode: "simultaneous",
    mirrorRule: "no_mirrors",
    timerSeconds: 30,
    numBans: 1,
    numPicks: 3,
    mapBanMode: "bo3",
    blueMapRole: "side_select",
    excludedMaps: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateRoomResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await createRoom(config);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return <RoomLinks result={result} />;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-xl border border-border bg-card p-6 flex flex-col gap-5"
    >
      <h2 className="text-center text-xl font-bold text-primary">
        Create Draft Room
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
        disabled={loading || (config.excludedMaps?.length ?? 0) !== 3}
        size="lg"
        className="w-full"
      >
        {loading ? "Creating..." : "Create Room"}
      </Button>
    </form>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return;
          const parsed = Number(raw);
          if (Number.isNaN(parsed)) return;
          onChange(Math.min(Math.max(parsed, min), max));
        }}
        className="rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
    </div>
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

function RoomLinks({ result }: { result: CreateRoomResponse }) {
  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
      <h2 className="text-center text-xl font-bold text-primary">
        Room Created!
      </h2>
      <p className="text-center text-sm text-muted-foreground">
        Share these links with the players:
      </p>

      <RoomLink label="Side Select" url={result.blueUrl} colorClass="text-team-blue" />
      <RoomLink label="Map Select" url={result.redUrl} colorClass="text-team-red" />
      <RoomLink label="Spectator" url={result.spectatorUrl} colorClass="text-muted-foreground" />
    </div>
  );
}

function RoomLink({
  label,
  url,
  colorClass,
}: {
  label: string;
  url: string;
  colorClass: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: ignore silently — link is visible and can be copied manually
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <span className={`text-sm font-medium ${colorClass}`}>{label}</span>
      <div className="flex items-center gap-2">
        <a
          href={url}
          className="flex-1 truncate rounded bg-secondary px-3 py-2 text-xs text-foreground hover:bg-secondary/80 transition-colors"
        >
          {url}
        </a>
        <button
          onClick={handleCopy}
          aria-label={copied ? `${label} link copied` : `Copy ${label} link`}
          className="shrink-0 rounded p-1.5 hover:bg-secondary transition-colors"
        >
          {copied ? (
            <Check className="size-4 text-primary" />
          ) : (
            <Copy className="size-4 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}
