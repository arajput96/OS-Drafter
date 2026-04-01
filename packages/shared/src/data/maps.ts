import type { GameMap } from "../types.js";

export const MAPS: readonly GameMap[] = [
  { id: "ahten-city", name: "Ahten City", icon: "/assets/maps/Ahten_City.png", active: true, description: "" },
  { id: "ai-mis-app", name: "Ai.Mi's App", icon: "/assets/maps/Ai.Mi_s_App.png", active: true, description: "" },
  { id: "atlas-lab", name: "Atlas Lab", icon: "/assets/maps/Atlas_Lab.png", active: true, description: "" },
  { id: "clarion-test-chamber", name: "Clarion Test Chamber", icon: "/assets/maps/Clarion_Test_Chamber.png", active: true, description: "" },
  { id: "demon-dais", name: "Demon Dais", icon: "/assets/maps/Demon_Dais.png", active: true, description: "" },
  { id: "gates-of-obscura", name: "Gates of Obscura", icon: "/assets/maps/Gates_of_Obscura_Example.png", active: true, description: "" },
  { id: "inkys-splash-zone", name: "Inky's Splash Zone", icon: "/assets/maps/Inky's_Splash_Zone.png", active: true, description: "" },
  { id: "night-market", name: "Night Market", icon: "/assets/maps/Night_Market.png", active: true, description: "" },
  { id: "oni-village", name: "Oni Village", icon: "/assets/maps/Oni_Village.png", active: true, description: "" },
  { id: "taiko-temple", name: "Taiko Temple", icon: "/assets/maps/Taiko_Temple.png", active: true, description: "" },
] as const;
