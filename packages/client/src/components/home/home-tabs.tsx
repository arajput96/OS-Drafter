"use client";

import { Tabs } from "@base-ui/react/tabs";
import { motion } from "framer-motion";
import { Map, Users } from "lucide-react";
import { APP_NAME } from "@os-drafter/shared";
import { MapDraftForm } from "@/components/room/map-draft-form";
import { CharacterDraftForm } from "@/components/room/character-draft-form";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

export function HomeTabs() {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8">
      {/* Hero */}
      <motion.div
        className="relative text-center"
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          custom={0}
          variants={fadeUp}
          className="text-5xl font-bold text-gradient-hero"
        >
          {APP_NAME}
        </motion.h1>
        <motion.p
          custom={1}
          variants={fadeUp}
          className="mt-2 text-base text-muted-foreground"
        >
          Draft tool for competitive play
        </motion.p>
      </motion.div>

      {/* Tabbed forms */}
      <motion.div
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="w-full"
      >
        <Tabs.Root defaultValue="map">
          <Tabs.List className="relative flex rounded-lg bg-secondary p-1">
            <Tabs.Indicator className="absolute rounded-md bg-card shadow-sm transition-all duration-200" />
            <Tabs.Tab
              value="map"
              className={({ active }: { active: boolean }) =>
                cn(
                  "relative z-10 flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <Map className="size-4" />
              Map Draft
            </Tabs.Tab>
            <Tabs.Tab
              value="character"
              className={({ active }: { active: boolean }) =>
                cn(
                  "relative z-10 flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <Users className="size-4" />
              Character Draft
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="map" keepMounted className="mt-4">
            <MapDraftForm />
          </Tabs.Panel>

          <Tabs.Panel value="character" keepMounted className="mt-4">
            <CharacterDraftForm />
          </Tabs.Panel>
        </Tabs.Root>
      </motion.div>
    </div>
  );
}
