"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog } from "@base-ui/react/dialog";
import { X, Check, Shuffle, Sparkles } from "lucide-react";
import { AWAKENINGS, CURRENT_AWAKENING_POOL, AWAKENING_EXCLUSIONS } from "@os-drafter/shared";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const poolAwakenings = AWAKENINGS.filter((a) =>
  CURRENT_AWAKENING_POOL.includes(a.id)
);

const awakeningMap = new Map(AWAKENINGS.map((a) => [a.id, a]));

interface AwakeningPickerDialogProps {
  mode: "random" | "choose";
  onModeChange: (mode: "random" | "choose") => void;
  excludedAwakenings: string[];
  onExcludedChange: (excluded: string[]) => void;
  chosenAwakenings: [string, string] | null;
  onChosenChange: (chosen: [string, string] | null) => void;
}

export function AwakeningPickerDialog({
  mode,
  onModeChange,
  excludedAwakenings,
  onExcludedChange,
  chosenAwakenings,
  onChosenChange,
}: AwakeningPickerDialogProps) {
  const [open, setOpen] = useState(false);
  const [draftMode, setDraftMode] = useState<"random" | "choose">("random");
  const [draftExcluded, setDraftExcluded] = useState<string[]>([]);
  const [draftChosen, setDraftChosen] = useState<string[]>([]);

  const excludedSet = new Set(draftExcluded);
  const chosenSet = new Set(draftChosen);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setDraftMode(mode);
      setDraftExcluded([...excludedAwakenings]);
      setDraftChosen(chosenAwakenings ? [...chosenAwakenings] : []);
    }
    setOpen(isOpen);
  };

  const toggleExclude = (id: string) => {
    if (excludedSet.has(id)) {
      setDraftExcluded(draftExcluded.filter((x) => x !== id));
    } else {
      const remaining = CURRENT_AWAKENING_POOL.filter(
        (x) => !excludedSet.has(x) && x !== id
      );
      if (remaining.length >= 2) {
        setDraftExcluded([...draftExcluded, id]);
      }
    }
  };

  const toggleChoose = (id: string) => {
    if (chosenSet.has(id)) {
      setDraftChosen(draftChosen.filter((x) => x !== id));
    } else if (draftChosen.length < 2) {
      setDraftChosen([...draftChosen, id]);
    }
  };

  const getDisabledInChooseMode = (id: string): boolean => {
    if (chosenSet.has(id)) return false;
    if (draftChosen.length >= 2) return true;
    if (draftChosen.length === 1) {
      const first = draftChosen[0];
      const exclusions = AWAKENING_EXCLUSIONS[first] ?? [];
      if (exclusions.includes(id)) return true;
    }
    return false;
  };

  const handleDone = () => {
    onModeChange(draftMode);
    if (draftMode === "random") {
      onExcludedChange(draftExcluded);
      onChosenChange(null);
    } else {
      onExcludedChange([]);
      if (draftChosen.length === 2) {
        onChosenChange(draftChosen as [string, string]);
      }
    }
    setOpen(false);
  };

  const canDone =
    draftMode === "random" || (draftMode === "choose" && draftChosen.length === 2);

  // Trigger label
  const getName = (id: string) => awakeningMap.get(id)?.name ?? id;
  let triggerLabel = "Awakenings: Random";
  if (mode === "random" && excludedAwakenings.length > 0) {
    triggerLabel = `Awakenings: Random (${excludedAwakenings.length} excluded)`;
  } else if (mode === "choose" && chosenAwakenings) {
    triggerLabel = `Awakenings: ${getName(chosenAwakenings[0])} & ${getName(chosenAwakenings[1])}`;
  } else if (mode === "choose") {
    triggerLabel = "Awakenings: Choose (select 2)";
  }

  // Chips
  const chips =
    mode === "random"
      ? excludedAwakenings.map((id) => ({ id, name: getName(id), type: "excluded" as const }))
      : chosenAwakenings
        ? chosenAwakenings.map((id) => ({ id, name: getName(id), type: "chosen" as const }))
        : [];

  const removeChip = (id: string) => {
    if (mode === "random") {
      onExcludedChange(excludedAwakenings.filter((x) => x !== id));
    } else {
      onChosenChange(null);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        Starting Awakenings
      </label>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.id}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs",
                chip.type === "excluded"
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-primary/30 bg-primary/10 text-primary"
              )}
            >
              {chip.name}
              <button
                type="button"
                aria-label={`Remove ${chip.name}`}
                onClick={() => removeChip(chip.id)}
                className="rounded-sm hover:bg-foreground/10 transition-colors"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Trigger className="flex items-center justify-center gap-2 rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary">
          <Sparkles className="size-4" />
          {triggerLabel}
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Popup className="fixed inset-0 z-50 m-auto flex h-fit max-h-[85vh] w-[calc(100%-2rem)] max-w-xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex flex-col gap-4 overflow-y-auto p-6">
              <Dialog.Title className="text-center text-lg font-bold text-primary">
                Starting Awakenings
              </Dialog.Title>

              {/* Mode toggle */}
              <div className="flex rounded-lg bg-secondary p-1">
                <button
                  type="button"
                  onClick={() => setDraftMode("random")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    draftMode === "random"
                      ? "bg-card text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Shuffle className="size-3.5" />
                  Random
                </button>
                <button
                  type="button"
                  onClick={() => setDraftMode("choose")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    draftMode === "choose"
                      ? "bg-card text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Sparkles className="size-3.5" />
                  Choose
                </button>
              </div>

              <Dialog.Description className="text-center text-xs text-muted-foreground">
                {draftMode === "random"
                  ? "Tap awakenings to exclude them from the random pool"
                  : "Select exactly 2 starting awakenings"}
              </Dialog.Description>

              {/* Grid */}
              <div className="grid grid-cols-6 gap-2">
                {poolAwakenings.map((awakening) => {
                  const isExcluded = draftMode === "random" && excludedSet.has(awakening.id);
                  const isChosen = draftMode === "choose" && chosenSet.has(awakening.id);
                  const isDisabledChoose =
                    draftMode === "choose" && getDisabledInChooseMode(awakening.id);
                  const remainingAfterExclude =
                    CURRENT_AWAKENING_POOL.filter((x) => !excludedSet.has(x) && x !== awakening.id).length;
                  const cannotExcludeMore =
                    draftMode === "random" && !isExcluded && remainingAfterExclude < 2;

                  return (
                    <button
                      key={awakening.id}
                      type="button"
                      disabled={isDisabledChoose || cannotExcludeMore}
                      onClick={() =>
                        draftMode === "random"
                          ? toggleExclude(awakening.id)
                          : toggleChoose(awakening.id)
                      }
                      title={awakening.name}
                      className={cn(
                        "group relative flex flex-col items-center overflow-hidden rounded-lg border transition-all",
                        isExcluded && "border-destructive ring-1 ring-destructive/30",
                        isChosen && "border-primary ring-1 ring-primary/30",
                        !isExcluded && !isChosen && "border-border",
                        (isDisabledChoose || cannotExcludeMore) && "opacity-30 cursor-not-allowed"
                      )}
                    >
                      <div className="relative aspect-square w-full p-1">
                        <Image
                          src={awakening.icon}
                          alt={awakening.name}
                          fill
                          className={cn(
                            "object-contain transition-all",
                            isExcluded && "brightness-50"
                          )}
                          sizes="64px"
                        />
                        {isExcluded && (
                          <div className="absolute inset-0 flex items-center justify-center bg-destructive/30">
                            <X className="size-4 text-white drop-shadow-md" />
                          </div>
                        )}
                        {isChosen && (
                          <div className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-primary/80">
                            <Check className="size-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <span className="w-full truncate px-0.5 pb-1 text-center text-[8px] leading-tight text-muted-foreground">
                        {awakening.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {draftMode === "random" && (
                <p className="text-center text-xs text-muted-foreground">
                  {CURRENT_AWAKENING_POOL.length - excludedSet.size} awakenings in pool
                </p>
              )}
              {draftMode === "choose" && (
                <p className="text-center text-xs text-muted-foreground">
                  {draftChosen.length}/2 selected
                </p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <Dialog.Close className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                Cancel
              </Dialog.Close>
              <Button
                type="button"
                variant="gradient"
                size="sm"
                disabled={!canDone}
                onClick={handleDone}
              >
                Done
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
