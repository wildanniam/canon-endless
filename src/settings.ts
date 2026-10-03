import { KEYS } from "./music/theory";
import type { Key, Mood } from "./music/theory";
import type { Composition } from "./music/composer";

export const SCENES = [
  "lake",
  "forest",
  "mountain",
  "blossom",
  "aurora",
  "rain",
] as const;
export type Scene = (typeof SCENES)[number];
export const LAYERS = [
  "melody",
  "bass",
  "chords",
  "pad",
  "pizzicato",
  "nature",
  "beat",
  "vinyl",
] as const;
export type Layer = (typeof LAYERS)[number];
export type Mix = Record<Layer, number>;
export const PRESETS: Record<string, Mix> = {
  "Classic quartet": {
    melody: 80,
    bass: 55,
    chords: 30,
    pad: 22,
    pizzicato: 0,
    nature: 12,
    beat: 0,
    vinyl: 0,
  },
  "Melody only": {
    melody: 85,
    bass: 0,
    chords: 0,
    pad: 0,
    pizzicato: 0,
    nature: 0,
    beat: 0,
    vinyl: 0,
  },
  "Full ensemble": {
    melody: 80,
    bass: 60,
    chords: 40,
    pad: 40,
    pizzicato: 28,
    nature: 12,
    beat: 0,
    vinyl: 0,
  },
  "Lo-fi afternoon": {
    melody: 78,
    bass: 60,
    chords: 48,
    pad: 12,
    pizzicato: 0,
    nature: 8,
    beat: 48,
    vinyl: 18,
  },
  "Soft focus": {
    melody: 65,
    bass: 35,
    chords: 15,
    pad: 45,
    pizzicato: 0,
    nature: 22,
    beat: 0,
    vinyl: 0,
  },
};
export interface Settings extends Composition {
  style: "classic" | "lofi";
  tempo: number;
  volume: number;
  scene: Scene;
  rotate: boolean;
  mix: Mix;
  cycle: number;
}

export function newSeed(): string {
  const words = ["willow", "fern", "river", "cedar", "moss", "dawn"];
  const values = crypto.getRandomValues(new Uint32Array(2));
  return `${words[values[0] % words.length]}-${values[1].toString(36).slice(0, 5)}`;
}

function number(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  const n = value?.trim() ? Number(value) : NaN;
  return Number.isFinite(n)
    ? Math.round(Math.max(min, Math.min(max, n)))
    : fallback;
}

export function parseSettings(
  search: string,
  fallbackSeed = "willow-2026",
): Settings {
  const p = new URLSearchParams(search);
  const seed = p.get("seed") || fallbackSeed;
  const key = p.get("key");
  const mood = p.get("mood");
  const scene = p.get("scene");
  const style = p.get("style") === "lofi" ? "lofi" : "classic";
  const defaults =
    PRESETS[style === "lofi" ? "Lo-fi afternoon" : "Classic quartet"];
  return {
    style,
    seed: /^[a-zA-Z0-9_-]{1,48}$/.test(seed) ? seed : fallbackSeed,
    key: key && Object.hasOwn(KEYS, key) ? (key as Key) : "D",
    mood: ["bright", "dreamy", "wistful"].includes(mood || "")
      ? (mood as Mood)
      : "bright",
    tempo: number(p.get("tempo"), style === "lofi" ? 68 : 72, 40, 120),
    density: number(p.get("density"), 40, 0, 100),
    volume: number(p.get("volume"), 65, 0, 100),
    scene: SCENES.includes(scene as Scene) ? (scene as Scene) : "lake",
    rotate: p.get("rotate") === "1",
    cycle: number(p.get("cycle"), 0, 0, 1_000_000),
    mix: Object.fromEntries(
      LAYERS.map((layer) => [
        layer,
        number(p.get(layer), defaults[layer], 0, 100),
      ]),
    ) as Mix,
  };
}

export function sessionUrl(settings: Settings, href: string): string {
  const url = new URL(href);
  url.search = "";
  url.hash = "";
  const p = url.searchParams;
  p.set("v", "1");
  for (const name of [
    "seed",
    "style",
    "key",
    "mood",
    "tempo",
    "density",
    "volume",
    "scene",
    "cycle",
  ] as const)
    p.set(name, String(settings[name]));
  if (settings.rotate) p.set("rotate", "1");
  for (const layer of LAYERS) p.set(layer, String(settings.mix[layer]));
  return url.href;
}

export interface Favorite {
  seed: string;
  query: string;
  savedAt: string;
}
export function readFavorites(storage: Pick<Storage, "getItem">): Favorite[] {
  try {
    const data: unknown = JSON.parse(
      storage.getItem("endless-canon:favorites:v1") || "[]",
    );
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (item): item is Favorite =>
          item &&
          typeof item.seed === "string" &&
          /^[a-zA-Z0-9_-]{1,48}$/.test(item.seed) &&
          typeof item.query === "string" &&
          item.query.length < 2000 &&
          typeof item.savedAt === "string",
      )
      .slice(0, 20);
  } catch {
    return [];
  }
}
