import { CHARACTERS } from "@os-drafter/shared";

export const characterMap = new Map(CHARACTERS.map((c) => [c.id, c]));

export function getCharacterSplashPath(name: string): string {
  return `/assets/characters/splash/${name}_splash.png`;
}
