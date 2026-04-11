import type { GameMap } from "../types.js";

export const MAPS: readonly GameMap[] = [
  { id: "ahten-city", name: "Ahten City", icon: "/assets/maps/Ahten_City.png", mapIcon: "/assets/maps/icons/Ahten_City_Icon.png", active: true, description: "" },
  { id: "ai-mis-app", name: "Ai.Mi's App", icon: "/assets/maps/Ai.Mi_s_App.png", mapIcon: "/assets/maps/icons/Ai.Mis_App_Icon.png", active: true, description: "" },
  { id: "atlas-lab", name: "Atlas Lab", icon: "/assets/maps/Atlas_Lab.png", mapIcon: "/assets/maps/icons/Atlass_Lab_Icon.png", active: true, description: "" },
  { id: "clarion-test-chamber", name: "Clarion Test Chamber", icon: "/assets/maps/Clarion_Test_Chamber.png", mapIcon: "/assets/maps/icons/CTC_Icon_2.png", active: true, description: "" },
  { id: "demon-dais", name: "Demon Dais", icon: "/assets/maps/Demon_Dais.png", mapIcon: "/assets/maps/icons/Demon_Dais_Icon.png", active: true, description: "" },
  { id: "gates-of-obscura", name: "Gates of Obscura", icon: "/assets/maps/Gates_of_Obscura_Example.png", mapIcon: "/assets/maps/icons/Gates_of_Obscura_Icon.png", active: true, description: "" },
  { id: "inkys-splash-zone", name: "Inky's Splash Zone", icon: "/assets/maps/Inky's_Splash_Zone.png", mapIcon: "/assets/maps/icons/Inkys_Splash_Zone_Icon_2.png", active: true, description: "" },
  { id: "night-market", name: "Night Market", icon: "/assets/maps/Night_Market.png", mapIcon: "/assets/maps/icons/Night_Market_Icon_2.png", active: true, description: "" },
  { id: "oni-village", name: "Oni Village", icon: "/assets/maps/Oni_Village.png", mapIcon: "/assets/maps/icons/Oni_Village_Icon_2.png", active: true, description: "" },
  { id: "taiko-temple", name: "Taiko Temple", icon: "/assets/maps/Taiko_Temple.png", mapIcon: "/assets/maps/icons/Taiko_Temple_Icon_2.png", active: true, description: "" },
] as const;

/** Default competitive map pool — the 7 maps currently used in competitive play. */
export const DEFAULT_MAP_POOL: readonly string[] = [
  "ai-mis-app",
  "atlas-lab",
  "demon-dais",
  "gates-of-obscura",
  "inkys-splash-zone",
  "night-market",
  "oni-village",
];
