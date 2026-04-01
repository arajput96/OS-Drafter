"use client";

import { useState } from "react";
import type { DraftConfig, DraftMode, BanMode, MirrorRule } from "@os-drafter/shared";
import { Button } from "@/components/ui/button";
import { createRoom, type CreateRoomResponse } from "@/lib/api";
import { Check, Copy } from "lucide-react";

const DRAFT_MODES: { value: DraftMode; label: string }[] = [
  { value: "snake", label: "Snake" },
  { value: "alternating", label: "Alternating" },
  { value: "simultaneous", label: "Simultaneous" },
];

const BAN_MODES: { value: BanMode; label: string }[] = [
  { value: "simultaneous", label: "Simultaneous" },
  { value: "staggered", label: "Staggered" },
  { value: "none", label: "None" },
];

const MIRROR_RULES: { value: MirrorRule; label: string }[] = [
  { value: "no_mirrors", label: "No Mirrors" },
  { value: "team_mirrors", label: "Team Mirrors" },
  { value: "full_duplicates", label: "Full Duplicates" },
];

export function RoomCreationForm() {
  const [config, setConfig] = useState<DraftConfig>({
    draftMode: "snake",
    banMode: "simultaneous",
    mirrorRule: "no_mirrors",
    timerSeconds: 30,
    numBans: 2,
    numPicks: 3,
    numMapBans: 2,
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
        label="Draft Mode"
        value={config.draftMode}
        options={DRAFT_MODES}
        onChange={(v) => setConfig({ ...config, draftMode: v as DraftMode })}
      />

      <SelectField
        label="Ban Mode"
        value={config.banMode}
        options={BAN_MODES}
        onChange={(v) => setConfig({ ...config, banMode: v as BanMode })}
      />

      <SelectField
        label="Mirror Rule"
        value={config.mirrorRule}
        options={MIRROR_RULES}
        onChange={(v) => setConfig({ ...config, mirrorRule: v as MirrorRule })}
      />

      <NumberField
        label="Timer (seconds)"
        value={config.timerSeconds}
        min={5}
        max={120}
        onChange={(v) => setConfig({ ...config, timerSeconds: v })}
      />

      <NumberField
        label="Bans per Team"
        value={config.numBans}
        min={0}
        max={5}
        onChange={(v) => setConfig({ ...config, numBans: v })}
      />

      <NumberField
        label="Picks per Team"
        value={config.numPicks}
        min={1}
        max={5}
        onChange={(v) => setConfig({ ...config, numPicks: v })}
      />

      <NumberField
        label="Map Bans per Team"
        value={config.numMapBans}
        min={0}
        max={4}
        onChange={(v) => setConfig({ ...config, numMapBans: v })}
      />

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <Button type="submit" disabled={loading} size="lg" className="w-full">
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
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
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

      <RoomLink label="Blue Team" url={result.blueUrl} colorClass="text-team-blue" />
      <RoomLink label="Red Team" url={result.redUrl} colorClass="text-team-red" />
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
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
