import { pick, random } from "./random";
import { KEYS, progression, scaleNotes, TICKS_PER_CYCLE } from "./theory";
import type { Key, Mood } from "./theory";

export const STAGES = [
  "Calm",
  "Flowing",
  "Lively",
  "Playful",
  "Ornamented",
  "Rest",
] as const;
export interface Composition {
  seed: string;
  key: Key;
  mood: Mood;
  density: number;
}
export interface Note {
  tick: number;
  duration: number;
  midi: number;
  velocity: number;
}
export interface Phrase {
  cycle: number;
  stage: number;
  notes: Note[];
}
export interface VoiceNote extends Note {
  voice: number;
}

/** Six stages per 24-cycle epoch, each lasting 2–6 cycles. O(1) seeking. */
export function stageAt(seed: string, cycle: number): number {
  const rng = random(`${seed}:stages:${Math.floor(cycle / 24)}`);
  const lengths = Array<number>(6).fill(2);
  for (let left = 12; left > 0;) {
    const i = Math.floor(rng() * 6);
    if (lengths[i] < 6) {
      lengths[i]++;
      left--;
    }
  }
  let local = cycle % 24;
  for (let i = 0; i < lengths.length; i++) {
    if (local < lengths[i]) return i;
    local -= lengths[i];
  }
  return 5;
}

export function compose(config: Composition, cycle: number): Phrase {
  const rng = random(
    `${config.seed}:v1:${config.key}:${config.mood}:${config.density}:${cycle}`,
  );
  const stage = stageAt(config.seed, cycle);
  const chords = progression(config.key, config.mood);
  const notes: Note[] = [];
  const base = 60 + KEYS[config.key];
  let previous = base + 7;
  let previousLeap = 0;
  const motif = Array.from({ length: 4 }, () => pick([-2, -1, 1, 1, 2], rng));
  const patterns = [
    [8, 4],
    [4, 2, 2],
    [2, 1, 1],
    [3, 1, 2, 2],
    [2, 1, 1, 4],
    [8, 8, 4],
  ];
  let index = 0;

  for (let tick = 0; tick < TICKS_PER_CYCLE;) {
    const chordIndex = Math.floor(tick / 8);
    const chord = chords[chordIndex];
    const scale = scaleNotes(config.key, config.mood, chordIndex);
    // A chord starts on every strong beat. Never allow a note to straddle it.
    const strong = tick % 8 === 0;
    const source = strong
      ? scale.filter((n) => chord.notes.includes(n % 12))
      : scale;
    let duration = pick(patterns[stage], rng);
    if (config.density < 30) duration = Math.min(8, duration * 2);
    if (config.density > 70) duration = Math.max(1, Math.floor(duration / 2));
    duration = Math.min(duration, 8 - (tick % 8));
    const direction =
      Math.abs(previousLeap) > 4
        ? -Math.sign(previousLeap)
        : motif[index % motif.length];
    const target = previous + direction * (stage === 3 ? 2 : 1);
    const candidates = source.map((midi) => ({
      midi,
      score:
        Math.abs(midi - target) +
        Math.abs(midi - (base + 10)) * 0.17 +
        rng() * 3,
    }));
    candidates.sort((a, b) => a.score - b.score);
    let midi = candidates[0].midi;
    // End on the dominant root, resolving into the next tonic cycle.
    if (tick + duration === TICKS_PER_CYCLE) midi = base + 7;
    notes.push({
      tick,
      duration,
      midi,
      velocity: (strong ? 0.76 : 0.55) + rng() * 0.12,
    });
    previousLeap = midi - previous;
    previous = midi;
    tick += duration;
    index++;
  }
  return { cycle, stage, notes };
}

/** Bounded cache; delayed voices replay the exact phrase at the same harmony. */
export class Canon {
  private cache = new Map<string, Phrase>();
  get size() {
    return this.cache.size;
  }

  phrase(config: Composition, cycle: number): Phrase {
    const id = `${config.seed}:${config.key}:${config.mood}:${config.density}:${cycle}`;
    let phrase = this.cache.get(id);
    if (!phrase) {
      phrase = compose(config, cycle);
      this.cache.set(id, phrase);
      if (this.cache.size > 12)
        this.cache.delete(this.cache.keys().next().value!);
    }
    return phrase;
  }

  notesAt(config: Composition, cycle: number, tick: number): VoiceNote[] {
    const result: VoiceNote[] = [];
    const rest = stageAt(config.seed, cycle) === 5;
    for (let voice = 0; voice < 3; voice++) {
      if (cycle < voice || (rest && voice === 2)) continue;
      for (const note of this.phrase(config, cycle - voice).notes) {
        if (note.tick === tick) result.push({ ...note, voice });
      }
    }
    return result;
  }
}
