import { useState } from "react";
import { Check, Copy, ClipboardList } from "lucide-react";
import type { CreateRoomResponse } from "@shared/types";
import { navigate } from "@/App";

export function SelectField<T extends string>({
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

export function NumberField({
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

export function CopyAllButton({
  links,
  size = "md",
}: {
  links: { label: string; url: string }[];
  size?: "sm" | "md";
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyAll = async () => {
    const text = links.map((l) => `${l.label} - ${l.url}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const sizeClasses = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  const iconSize = size === "sm" ? "size-3.5" : "size-4";

  return (
    <button
      type="button"
      onClick={handleCopyAll}
      className={`flex items-center justify-center gap-2 rounded-lg border border-border font-medium hover:bg-secondary transition-colors ${sizeClasses}`}
    >
      {copied ? (
        <>
          <Check className={`${iconSize} text-primary`} />
          Copied!
        </>
      ) : (
        <>
          <ClipboardList className={`${iconSize} text-muted-foreground`} />
          Copy All Links
        </>
      )}
    </button>
  );
}

export function RoomLinks({
  result,
  blueLabel,
  redLabel,
}: {
  result: CreateRoomResponse;
  blueLabel: string;
  redLabel: string;
}) {
  return (
    <div className="w-full rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
      <h2 className="text-center text-xl font-bold text-primary">
        Room Created!
      </h2>
      <p className="text-center text-sm text-muted-foreground">
        Share these links with the players:
      </p>

      <RoomLink label={blueLabel} url={result.blueUrl} colorClass="text-team-blue" />
      <RoomLink label={redLabel} url={result.redUrl} colorClass="text-team-red" />
      <RoomLink label="Spectator" url={result.spectatorUrl} colorClass="text-muted-foreground" />
      <RoomLink label="OBS Overlay" url={result.overlayUrl} colorClass="text-muted-foreground" />

      <CopyAllButton
        links={[
          { label: blueLabel, url: result.blueUrl },
          { label: redLabel, url: result.redUrl },
          { label: "Spectator", url: result.spectatorUrl },
          { label: "OBS Overlay", url: result.overlayUrl },
        ]}
      />
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
      // ignore
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <span className={`text-sm font-medium ${colorClass}`}>{label}</span>
      <div className="flex items-center gap-2">
        <a
          href={url}
          onClick={(e) => {
            e.preventDefault();
            navigate(new URL(url).pathname + new URL(url).search);
          }}
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
