import type { Awakening } from "../types.js";

export const AWAKENINGS: readonly Awakening[] = [
  { id: "adrenaline-rush", name: "Adrenaline Rush", icon: "/assets/awakenings/Adrenaline_Rush.png" },
  { id: "aerials", name: "Aerials", icon: "/assets/awakenings/Aerials.png" },
  { id: "among-titans", name: "Among Titans", icon: "/assets/awakenings/Among_Titans.png" },
  { id: "berserker", name: "Berserker", icon: "/assets/awakenings/Berserker.png" },
  { id: "big-fish", name: "Big Fish", icon: "/assets/awakenings/Big_Fish.png" },
  { id: "built-different", name: "Built Different", icon: "/assets/awakenings/Built_Different.png" },
  { id: "bulk-up", name: "Bulk Up", icon: "/assets/awakenings/Bulk_Up.png" },
  { id: "cast-to-last", name: "Cast to Last", icon: "/assets/awakenings/Cast_to_Last.png" },
  { id: "catalyst", name: "Catalyst", icon: "/assets/awakenings/Catalyst.png" },
  { id: "chronoboost", name: "Chronoboost", icon: "/assets/awakenings/Chronoboost.png" },
  { id: "deadeye", name: "Deadeye", icon: "/assets/awakenings/Deadeye.png" },
  { id: "demolitionist", name: "Demolitionist", icon: "/assets/awakenings/Demolitionist.png" },
  { id: "egoist", name: "Egoist", icon: "/assets/awakenings/Egoist.png" },
  { id: "explosive-entrance", name: "Explosive Entrance", icon: "/assets/awakenings/Explosive_Entrance.png" },
  { id: "extra-special", name: "Extra Special", icon: "/assets/awakenings/Extra_Special.png" },
  { id: "fight-or-flight", name: "Fight or Flight", icon: "/assets/awakenings/Fight_or_Flight.png" },
  { id: "fire-up", name: "Fire Up!", icon: "/assets/awakenings/Fire_Up!.png" },
  { id: "glass-cannon", name: "Glass Cannon", icon: "/assets/awakenings/Glass_Cannon.png" },
  { id: "heavy-impact", name: "Heavy Impact", icon: "/assets/awakenings/Heavy_Impact.png" },
  { id: "hotshot", name: "Hotshot", icon: "/assets/awakenings/Hotshot.png" },
  { id: "inner-focus", name: "Inner Focus", icon: "/assets/awakenings/Inner_Focus.png" },
  { id: "knifes-edge", name: "Knife's Edge", icon: "/assets/awakenings/Knife's_Edge.png" },
  { id: "might-of-the-colossus", name: "Might of the Colossus", icon: "/assets/awakenings/Might_of_the_Colossus.png" },
  { id: "missile-propulsion", name: "Missile Propulsion", icon: "/assets/awakenings/Missile_Propulsion.png" },
  { id: "monumentalist", name: "Monumentalist", icon: "/assets/awakenings/Monumentalist.png" },
  { id: "omega-infused-accelerator", name: "Omega Infused Accelerator", icon: "/assets/awakenings/Omega_Infused_Accelerator.png" },
  { id: "one-two-punch", name: "One-Two Punch", icon: "/assets/awakenings/One-Two_Punch.png" },
  { id: "orb-dancer", name: "Orb Dancer", icon: "/assets/awakenings/Orb_Dancer.png" },
  { id: "orb-ponderer", name: "Orb Ponderer", icon: "/assets/awakenings/Orb_Ponderer.png" },
  { id: "orb-replicator", name: "Orb Replicator", icon: "/assets/awakenings/Orb_Replicator.png" },
  { id: "peak-performance", name: "Peak Performance", icon: "/assets/awakenings/Peak_Performance.png" },
  { id: "perfect-form", name: "Perfect Form", icon: "/assets/awakenings/Perfect_Form.png" },
  { id: "primetime", name: "Primetime", icon: "/assets/awakenings/Primetime.png" },
  { id: "prize-fighter", name: "Prize Fighter", icon: "/assets/awakenings/Prize_Fighter.png" },
  { id: "quick-strike", name: "Quick Strike", icon: "/assets/awakenings/Quick_Strike.png" },
  { id: "rampage", name: "Rampage", icon: "/assets/awakenings/Rampage.png" },
  { id: "rapid-fire", name: "Rapid Fire", icon: "/assets/awakenings/Rapid_Fire.png" },
  { id: "recovery-drone", name: "Recovery Drone", icon: "/assets/awakenings/Recovery_Drone.png" },
  { id: "reptile-remedy", name: "Reptile Remedy", icon: "/assets/awakenings/Reptile_Remedy.png" },
  { id: "reverberation", name: "Reverberation", icon: "/assets/awakenings/Reverberation.png" },
  { id: "siege-machine", name: "Siege Machine", icon: "/assets/awakenings/Siege_Machine.png" },
  { id: "spark-of-agility", name: "Spark of Agility", icon: "/assets/awakenings/Spark_of_Agility.png" },
  { id: "spark-of-focus", name: "Spark of Focus", icon: "/assets/awakenings/Spark_of_Focus.png" },
  { id: "spark-of-resilience", name: "Spark of Resilience", icon: "/assets/awakenings/Spark_of_Resilience.png" },
  { id: "spark-of-strength", name: "Spark of Strength", icon: "/assets/awakenings/Spark_of_Strength.png" },
  { id: "specialized-training", name: "Specialized Training", icon: "/assets/awakenings/Specialized_Training.png" },
  { id: "stacks-on-stacks", name: "Stacks On Stacks", icon: "/assets/awakenings/Stacks_On_Stacks.png" },
  { id: "stagger-swagger", name: "Stagger Swagger", icon: "/assets/awakenings/Stagger_Swagger.png" },
  { id: "stinger", name: "Stinger", icon: "/assets/awakenings/Stinger.png" },
  { id: "super-surge", name: "Super Surge", icon: "/assets/awakenings/Super_Surge.png" },
  { id: "team-player", name: "Team Player", icon: "/assets/awakenings/Team_Player.png" },
  { id: "tempo-swing", name: "Tempo Swing", icon: "/assets/awakenings/Tempo_Swing.png" },
  { id: "timeless-creator", name: "Timeless Creator", icon: "/assets/awakenings/Timeless_Creator.png" },
  { id: "twin-drive", name: "Twin Drive", icon: "/assets/awakenings/Twin_Drive.png" },
  { id: "unstoppable", name: "Unstoppable", icon: "/assets/awakenings/Unstoppable.png" },
] as const;

/**
 * Awakening exclusion rules: if the first randomly selected awakening is key K,
 * the second awakening must NOT be any ID in the value array.
 * Source: https://omegastrikers.wiki.gg/wiki/Starting_Awakening_Exclusions
 */
export const AWAKENING_EXCLUSIONS: Readonly<Record<string, readonly string[]>> = {
  "spark-of-resilience": ["spark-of-strength", "spark-of-agility", "spark-of-focus", "big-fish", "stagger-swagger", "bulk-up", "peak-performance", "tempo-swing", "orb-ponderer", "orb-dancer", "reverberation", "unstoppable", "recovery-drone", "reptile-remedy", "catalyst"],
  "spark-of-focus": ["spark-of-resilience", "spark-of-strength", "spark-of-agility", "extra-special", "rapid-fire", "primetime", "perfect-form", "twin-drive", "hotshot", "adrenaline-rush", "heavy-impact", "orb-ponderer", "orb-dancer", "reverberation"],
  "spark-of-strength": ["spark-of-focus", "spark-of-resilience", "spark-of-agility", "specialized-training", "adrenaline-rush", "prize-fighter", "heavy-impact", "bulk-up", "super-surge", "glass-cannon", "orb-ponderer", "orb-dancer", "one-two-punch", "explosive-entrance", "stinger", "might-of-the-colossus", "built-different"],
  "spark-of-agility": ["spark-of-focus", "spark-of-resilience", "spark-of-strength", "stacks-on-stacks", "chronoboost", "glass-cannon", "peak-performance", "super-surge", "aerials", "fight-or-flight", "orb-dancer", "among-titans", "orb-ponderer", "explosive-entrance", "egoist", "knifes-edge"],
  "extra-special": ["specialized-training", "twin-drive", "rapid-fire", "spark-of-focus", "orb-ponderer"],
  "specialized-training": ["extra-special", "spark-of-strength", "adrenaline-rush", "stinger", "deadeye", "bulk-up", "prize-fighter", "might-of-the-colossus"],
  "rapid-fire": ["primetime", "extra-special", "twin-drive", "hotshot", "spark-of-focus", "reverberation", "orb-ponderer", "stinger"],
  "primetime": ["rapid-fire", "spark-of-focus", "reverberation", "stinger"],
  "deadeye": ["missile-propulsion", "aerials", "glass-cannon", "siege-machine", "stinger", "specialized-training"],
  "missile-propulsion": ["deadeye", "aerials", "glass-cannon", "siege-machine", "stinger"],
  "perfect-form": ["heavy-impact", "tempo-swing", "spark-of-focus", "one-two-punch", "orb-ponderer"],
  "twin-drive": ["super-surge", "chronoboost", "aerials", "rapid-fire", "extra-special", "spark-of-focus", "fight-or-flight", "orb-ponderer", "explosive-entrance"],
  "super-surge": ["twin-drive", "chronoboost", "aerials", "spark-of-strength", "spark-of-agility", "explosive-entrance", "stinger", "might-of-the-colossus"],
  "cast-to-last": ["chronoboost", "timeless-creator", "monumentalist", "siege-machine"],
  "monumentalist": ["timeless-creator", "cast-to-last", "siege-machine"],
  "timeless-creator": ["monumentalist", "cast-to-last", "siege-machine"],
  "hotshot": ["rapid-fire", "spark-of-focus", "team-player", "reverberation", "quick-strike"],
  "adrenaline-rush": ["prize-fighter", "specialized-training", "one-two-punch", "spark-of-focus", "reverberation", "demolitionist", "stinger", "might-of-the-colossus", "spark-of-strength"],
  "prize-fighter": ["adrenaline-rush", "spark-of-strength", "recovery-drone", "stinger", "specialized-training", "might-of-the-colossus"],
  "stinger": ["rapid-fire", "missile-propulsion", "adrenaline-rush", "spark-of-strength", "heavy-impact", "one-two-punch", "bulk-up", "super-surge", "explosive-entrance", "specialized-training", "deadeye", "primetime", "prize-fighter", "might-of-the-colossus", "stagger-swagger", "tempo-swing"],
  "built-different": ["big-fish", "heavy-impact", "spark-of-strength", "demolitionist", "recovery-drone", "explosive-entrance", "rampage", "might-of-the-colossus", "quick-strike"],
  "big-fish": ["built-different", "spark-of-resilience", "peak-performance", "bulk-up", "stagger-swagger", "tempo-swing", "reverberation", "demolitionist", "unstoppable", "recovery-drone", "reptile-remedy", "rampage", "might-of-the-colossus", "catalyst", "quick-strike"],
  "stagger-swagger": ["big-fish", "bulk-up", "peak-performance", "spark-of-resilience", "tempo-swing", "stinger", "reverberation", "among-titans", "fight-or-flight", "unstoppable", "reptile-remedy", "rampage", "catalyst", "egoist", "knifes-edge", "stacks-on-stacks", "orb-dancer", "recovery-drone"],
  "one-two-punch": ["perfect-form", "heavy-impact", "spark-of-strength", "adrenaline-rush", "explosive-entrance", "stinger", "might-of-the-colossus"],
  "stacks-on-stacks": ["stagger-swagger", "glass-cannon", "spark-of-agility", "rampage", "among-titans", "fight-or-flight", "orb-dancer", "unstoppable", "recovery-drone", "reptile-remedy", "egoist", "knifes-edge"],
  "chronoboost": ["super-surge", "cast-to-last", "aerials", "twin-drive", "spark-of-agility", "explosive-entrance"],
  "glass-cannon": ["stacks-on-stacks", "deadeye", "missile-propulsion", "aerials", "spark-of-agility", "spark-of-strength", "among-titans", "knifes-edge", "orb-dancer", "unstoppable", "might-of-the-colossus", "egoist", "fight-or-flight"],
  "heavy-impact": ["built-different", "perfect-form", "one-two-punch", "spark-of-strength", "spark-of-focus", "reverberation", "orb-ponderer", "explosive-entrance", "stinger", "might-of-the-colossus"],
  "peak-performance": ["stagger-swagger", "big-fish", "bulk-up", "spark-of-resilience", "spark-of-agility", "tempo-swing", "reptile-remedy", "among-titans", "reverberation", "orb-dancer", "unstoppable", "catalyst", "egoist", "fight-or-flight", "knifes-edge"],
  "bulk-up": ["stagger-swagger", "big-fish", "peak-performance", "spark-of-resilience", "spark-of-strength", "tempo-swing", "stinger", "reverberation", "unstoppable", "specialized-training", "reptile-remedy", "might-of-the-colossus", "catalyst"],
  "aerials": ["deadeye", "missile-propulsion", "super-surge", "chronoboost", "glass-cannon", "spark-of-agility", "explosive-entrance", "siege-machine", "twin-drive"],
  "quick-strike": ["hotshot", "built-different", "big-fish", "demolitionist", "team-player", "catalyst", "egoist", "fire-up", "fight-or-flight", "recovery-drone", "rampage", "might-of-the-colossus"],
  "tempo-swing": ["perfect-form", "big-fish", "bulk-up", "peak-performance", "spark-of-resilience", "stagger-swagger", "reverberation", "unstoppable", "stinger", "rampage", "reptile-remedy", "might-of-the-colossus"],
  "orb-dancer": ["orb-ponderer", "stacks-on-stacks", "stagger-swagger", "spark-of-agility", "spark-of-focus", "spark-of-resilience", "spark-of-strength", "glass-cannon", "peak-performance", "among-titans", "orb-replicator", "unstoppable", "recovery-drone", "reptile-remedy", "egoist", "fight-or-flight", "knifes-edge"],
  "orb-ponderer": ["orb-dancer", "spark-of-focus", "spark-of-resilience", "spark-of-strength", "spark-of-agility", "rapid-fire", "twin-drive", "perfect-form", "heavy-impact", "extra-special", "reverberation", "orb-replicator", "unstoppable", "recovery-drone", "reptile-remedy", "egoist", "fight-or-flight", "knifes-edge"],
  "orb-replicator": ["orb-ponderer", "orb-dancer", "fire-up", "team-player", "among-titans"],
  "reverberation": ["big-fish", "bulk-up", "peak-performance", "spark-of-resilience", "tempo-swing", "spark-of-focus", "rapid-fire", "orb-ponderer", "heavy-impact", "adrenaline-rush", "hotshot", "unstoppable", "reptile-remedy", "catalyst", "primetime", "stagger-swagger"],
  "catalyst": ["egoist", "fire-up", "quick-strike", "bulk-up", "reverberation", "peak-performance", "reptile-remedy", "unstoppable", "big-fish", "recovery-drone", "stagger-swagger", "spark-of-resilience"],
  "egoist": ["fire-up", "catalyst", "quick-strike", "stagger-swagger", "peak-performance", "among-titans", "spark-of-agility", "knifes-edge", "orb-dancer", "orb-ponderer", "stacks-on-stacks", "glass-cannon", "fight-or-flight"],
  "fire-up": ["catalyst", "egoist", "among-titans", "orb-replicator", "team-player", "quick-strike"],
  "among-titans": ["spark-of-agility", "fire-up", "orb-replicator", "orb-dancer", "stacks-on-stacks", "stagger-swagger", "peak-performance", "glass-cannon", "fight-or-flight", "team-player", "might-of-the-colossus", "egoist", "knifes-edge"],
  "demolitionist": ["built-different", "big-fish", "adrenaline-rush", "quick-strike", "recovery-drone", "rampage", "might-of-the-colossus"],
  "fight-or-flight": ["twin-drive", "stagger-swagger", "among-titans", "stacks-on-stacks", "knifes-edge", "quick-strike", "rampage", "spark-of-agility", "peak-performance", "glass-cannon", "orb-dancer", "orb-ponderer", "egoist"],
  "knifes-edge": ["fight-or-flight", "glass-cannon", "unstoppable", "recovery-drone", "peak-performance", "stacks-on-stacks", "stagger-swagger", "among-titans", "egoist", "spark-of-agility", "orb-dancer", "orb-ponderer"],
  "team-player": ["fire-up", "orb-replicator", "quick-strike", "among-titans", "hotshot"],
  "unstoppable": ["big-fish", "stagger-swagger", "stacks-on-stacks", "peak-performance", "bulk-up", "reverberation", "tempo-swing", "orb-dancer", "orb-ponderer", "glass-cannon", "spark-of-resilience", "recovery-drone", "knifes-edge", "reptile-remedy", "rampage", "catalyst"],
  "recovery-drone": ["built-different", "big-fish", "demolitionist", "unstoppable", "stacks-on-stacks", "knifes-edge", "orb-dancer", "orb-ponderer", "prize-fighter", "spark-of-resilience", "quick-strike", "reptile-remedy", "rampage", "might-of-the-colossus", "stagger-swagger", "catalyst"],
  "explosive-entrance": ["built-different", "heavy-impact", "super-surge", "aerials", "chronoboost", "one-two-punch", "spark-of-strength", "spark-of-agility", "twin-drive", "stinger", "might-of-the-colossus"],
  "siege-machine": ["aerials", "missile-propulsion", "monumentalist", "timeless-creator", "cast-to-last", "deadeye"],
  "reptile-remedy": ["big-fish", "bulk-up", "reverberation", "peak-performance", "spark-of-resilience", "tempo-swing", "unstoppable", "stagger-swagger", "recovery-drone", "rampage", "stacks-on-stacks", "orb-ponderer", "orb-dancer", "catalyst"],
  "rampage": ["big-fish", "built-different", "recovery-drone", "demolitionist", "quick-strike", "fight-or-flight", "unstoppable", "stacks-on-stacks", "stagger-swagger", "reptile-remedy", "tempo-swing"],
  "might-of-the-colossus": ["specialized-training", "prize-fighter", "adrenaline-rush", "one-two-punch", "heavy-impact", "bulk-up", "super-surge", "glass-cannon", "explosive-entrance", "stinger", "spark-of-strength", "big-fish", "built-different", "recovery-drone", "demolitionist", "among-titans", "quick-strike", "tempo-swing"],
};

/**
 * Pick two distinct awakenings from the pool, respecting exclusion rules.
 * Returns a tuple of [first, second] awakening IDs.
 */
export function pickTwoAwakenings(
  pool: readonly string[],
  exclusions: Readonly<Record<string, readonly string[]>> = AWAKENING_EXCLUSIONS,
): [string, string] {
  if (pool.length < 2) {
    throw new Error("Pool must contain at least 2 awakenings");
  }

  // Shuffle indices to try first picks in random order
  const indices = Array.from({ length: pool.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }

  for (const firstIndex of indices) {
    const first = pool[firstIndex]!;
    const excluded = new Set(exclusions[first] ?? []);
    excluded.add(first);
    const validSecondPool = pool.filter((id) => !excluded.has(id));

    if (validSecondPool.length > 0) {
      const second = validSecondPool[Math.floor(Math.random() * validSecondPool.length)]!;
      return [first, second];
    }
  }

  throw new Error("No valid awakening pair exists in the pool");
}

/** Awakenings that are excluded from the random pool by default at room
 *  creation. Users can opt them back in via the picker. */
export const DEFAULT_EXCLUDED_AWAKENINGS: readonly string[] = ["team-player"];

/** IDs of awakenings currently legal in drafts. */
export const CURRENT_AWAKENING_POOL: readonly string[] = [
  "among-titans",
  "aerials",
  "berserker",
  "built-different",
  "bulk-up",
  "cast-to-last",
  "deadeye",
  "demolitionist",
  "explosive-entrance",
  "extra-special",
  "glass-cannon",
  "heavy-impact",
  "hotshot",
  "inner-focus",
  "missile-propulsion",
  "monumentalist",
  "omega-infused-accelerator",
  "one-two-punch",
  "orb-dancer",
  "peak-performance",
  "primetime",
  "prize-fighter",
  "quick-strike",
  "rampage",
  "reptile-remedy",
  "siege-machine",
  "specialized-training",
  "stacks-on-stacks",
  "stinger",
  "super-surge",
  "team-player",
  "tempo-swing",
  "timeless-creator",
  "twin-drive",
];

// Fail fast if a default-excluded id is ever renamed or removed.
const _awakeningIds = new Set(AWAKENINGS.map((a) => a.id));
for (const id of DEFAULT_EXCLUDED_AWAKENINGS) {
  if (!_awakeningIds.has(id)) {
    throw new Error(`DEFAULT_EXCLUDED_AWAKENINGS references unknown id "${id}"`);
  }
}
