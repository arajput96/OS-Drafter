"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog } from "@base-ui/react/dialog";
import { Check, MapPin } from "lucide-react";
import { MAPS } from "@os-drafter/shared";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const activeMaps = MAPS.filter((m) => m.active);

interface MapPickerDialogProps {
  selectedMaps: string[];
  onChange: (selected: string[]) => void;
  minSelected?: number;
}

export function MapPickerDialog({ selectedMaps, onChange, minSelected = 7 }: MapPickerDialogProps) {
  const [open, setOpen] = useState(false);
  const [draftSelected, setDraftSelected] = useState<string[]>([]);

  const draftSet = new Set(draftSelected);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setDraftSelected([...selectedMaps]);
    }
    setOpen(isOpen);
  };

  const toggle = (mapId: string) => {
    if (draftSet.has(mapId)) {
      if (draftSet.size > minSelected) {
        setDraftSelected(draftSelected.filter((id) => id !== mapId));
      }
    } else {
      setDraftSelected([...draftSelected, mapId]);
    }
  };

  const handleDone = () => {
    onChange(draftSelected);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        Map Pool ({selectedMaps.length} selected)
      </label>

      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Trigger
          className="flex items-center justify-center gap-2 rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
        >
          <MapPin className="size-4" />
          Edit map pool
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Popup className="fixed inset-0 z-50 m-auto flex h-fit max-h-[85vh] w-[calc(100%-2rem)] max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex flex-col gap-4 overflow-y-auto p-6">
              <Dialog.Title className="text-center text-lg font-bold text-primary">
                Select Map Pool ({draftSet.size}/{activeMaps.length})
              </Dialog.Title>
              <Dialog.Description className="text-center text-xs text-muted-foreground">
                Choose which maps are available in the draft (min {minSelected})
              </Dialog.Description>

              <div className="grid grid-cols-3 gap-3">
                {activeMaps.map((map) => {
                  const isSelected = draftSet.has(map.id);
                  return (
                    <button
                      key={map.id}
                      type="button"
                      onClick={() => toggle(map.id)}
                      className={cn(
                        "group relative flex flex-col overflow-hidden rounded-lg border transition-all",
                        isSelected
                          ? "border-primary/40 ring-1 ring-primary/20"
                          : "border-border opacity-50",
                      )}
                    >
                      <div className="relative aspect-video w-full">
                        <Image
                          src={map.icon}
                          alt={map.name}
                          fill
                          className={cn(
                            "object-cover transition-all",
                            !isSelected && "brightness-50"
                          )}
                          sizes="150px"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-primary/80">
                            <Check className="size-3 text-white" />
                          </div>
                        )}
                      </div>
                      <span
                        className={cn(
                          "px-1.5 py-1 text-[10px] font-medium leading-tight text-center truncate",
                          isSelected ? "text-foreground" : "text-muted-foreground"
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
                disabled={draftSet.size < minSelected}
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
