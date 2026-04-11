"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog } from "@base-ui/react/dialog";
import { X, MapPin } from "lucide-react";
import { MAPS } from "@os-drafter/shared";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const activeMaps = MAPS.filter((m) => m.active);

interface MapPickerDialogProps {
  excludedMaps: string[];
  onChange: (excluded: string[]) => void;
}

export function MapPickerDialog({ excludedMaps, onChange }: MapPickerDialogProps) {
  const [open, setOpen] = useState(false);
  const [draftExcluded, setDraftExcluded] = useState<string[]>([]);

  const draftSet = new Set(draftExcluded);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setDraftExcluded([...excludedMaps]);
    }
    setOpen(isOpen);
  };

  const toggle = (mapId: string) => {
    if (draftSet.has(mapId)) {
      setDraftExcluded(draftExcluded.filter((id) => id !== mapId));
    } else if (draftSet.size < 3) {
      setDraftExcluded([...draftExcluded, mapId]);
    }
  };

  const handleDone = () => {
    onChange(draftExcluded);
    setOpen(false);
  };

  const removeChip = (mapId: string) => {
    onChange(excludedMaps.filter((id) => id !== mapId));
  };

  const mapNameById = (id: string) =>
    activeMaps.find((m) => m.id === id)?.name ?? id;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        Exclude Maps ({excludedMaps.length}/3)
      </label>

      {/* Chips for currently excluded maps */}
      {excludedMaps.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {excludedMaps.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive"
            >
              {mapNameById(id)}
              <button
                type="button"
                onClick={() => removeChip(id)}
                className="rounded-sm hover:bg-destructive/20 transition-colors"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Trigger
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border border-border bg-input px-3 py-2 text-sm transition-colors hover:bg-secondary",
            excludedMaps.length === 3
              ? "text-muted-foreground"
              : "text-foreground"
          )}
        >
          <MapPin className="size-4" />
          {excludedMaps.length === 3
            ? "Change excluded maps"
            : `Select ${3 - excludedMaps.length} map${3 - excludedMaps.length !== 1 ? "s" : ""} to exclude`}
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Popup className="fixed inset-0 z-50 m-auto flex h-fit max-h-[85vh] w-[calc(100%-2rem)] max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex flex-col gap-4 overflow-y-auto p-6">
              <Dialog.Title className="text-center text-lg font-bold text-primary">
                Exclude Maps ({draftSet.size}/3)
              </Dialog.Title>
              <Dialog.Description className="text-center text-xs text-muted-foreground">
                Select exactly 3 maps to exclude from the draft pool
              </Dialog.Description>

              <div className="grid grid-cols-3 gap-3">
                {activeMaps.map((map) => {
                  const isExcluded = draftSet.has(map.id);
                  const isDisabled = !isExcluded && draftSet.size >= 3;
                  return (
                    <button
                      key={map.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => toggle(map.id)}
                      className={cn(
                        "group relative flex flex-col overflow-hidden rounded-lg border transition-all",
                        isExcluded
                          ? "border-destructive ring-1 ring-destructive/30"
                          : "border-border hover:border-primary/40",
                        isDisabled && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <div className="relative aspect-video w-full">
                        <Image
                          src={map.icon}
                          alt={map.name}
                          fill
                          className={cn(
                            "object-cover transition-all",
                            isExcluded && "brightness-50"
                          )}
                          sizes="150px"
                        />
                        {isExcluded && (
                          <div className="absolute inset-0 flex items-center justify-center bg-destructive/30">
                            <X className="size-6 text-white drop-shadow-md" />
                          </div>
                        )}
                      </div>
                      <span
                        className={cn(
                          "px-1.5 py-1 text-[10px] font-medium leading-tight text-center truncate",
                          isExcluded
                            ? "text-destructive line-through"
                            : "text-muted-foreground"
                        )}
                      >
                        {map.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <Dialog.Close className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                Cancel
              </Dialog.Close>
              <Button
                type="button"
                variant="gradient"
                size="sm"
                disabled={draftSet.size !== 3}
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
