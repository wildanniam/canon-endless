export const KEYS = {
  C: 0,
  D: 2,
  "E♭": 3,
  F: 5,
  G: 7,
  A: 9,
  "B♭": 10,
} as const;
export type Key = keyof typeof KEYS;
export type Mood = "bright" | "dreamy" | "wistful";
export const BEATS_PER_CYCLE = 16;
export const TICKS_PER_BEAT = 4;
export const TICKS_PER_CYCLE = BEATS_PER_CYCLE * TICKS_PER_BEAT;
const NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];

export interface Chord {
  name: string;
  root: number;
  notes: number[];
  roman: string;
}

export function progression(key: Key, mood: Mood): Chord[] {
  const minor = mood === "wistful";
  const roots = minor ? [0, 7, 8, 3, 5, 0, 5, 7] : [0, 7, 9, 4, 5, 0, 5, 7];
  const minors = minor
    ? [true, true, false, false, true, true, true, false]
    : [false, false, true, true, false, false, false, false];
  const romans = minor
    ? ["i", "v", "VI", "III", "iv", "i", "iv", "V"]
    : ["I", "V", "vi", "iii", "IV", "I", "IV", "V"];
  return roots.map((offset, i) => {
    const root = (KEYS[key] + offset) % 12;
    return {
      name: NAMES[root] + (minors[i] ? "m" : ""),
      root,
      notes: [root, (root + (minors[i] ? 3 : 4)) % 12, (root + 7) % 12],
      roman: romans[i],
    };
  });
}

export function scaleNotes(key: Key, mood: Mood, chordIndex: number): number[] {
  const base = 60 + KEYS[key];
  const scale =
    mood === "wistful"
      ? MINOR.map((n) => (n === 10 && chordIndex === 7 ? 11 : n))
      : MAJOR;
  return Array.from({ length: 25 }, (_, i) => base + i).filter((n) =>
    scale.includes((n - base) % 12),
  );
}

export function frequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}
