import { pick, random } from "./random";
import { KEYS, progression, scaleNotes } from "./theory";
import type { Composition, Note, Phrase } from "./composer";

/** A separate seeded arrangement: gaps, repeated motifs and off-beat replies. */
export function composeLoFi(
  config: Composition,
  cycle: number,
  stage: number,
): Phrase {
  const rng = random(
    `${config.seed}:lofi-v1:${config.key}:${config.mood}:${config.density}:${cycle}`,
  );
  const chords = progression(config.key, config.mood);
  const base = 60 + KEYS[config.key];
  const notes: Note[] = [];
  const motif = Array.from({ length: 4 }, () => pick([-2, -1, 0, 1, 2], rng));
  let previous = base + 7;
  for (let index = 0; index < 8; index++) {
    const chord = chords[index];
    const scale = scaleNotes(config.key, config.mood, index).filter(
      (n) => n <= base + 14,
    );
    const pattern =
      stage === 5 || config.density < 30
        ? [0, 4]
        : config.density > 70
          ? [0, 2, 3, 6]
          : pick(
              [
                [0, 3, 6],
                [0, 2, 5],
                [0, 3],
              ],
              rng,
            );
    pattern.forEach((offset, i) => {
      const choices =
        offset === 0
          ? scale.filter((n) => chord.notes.includes(n % 12))
          : scale;
      const target = previous + motif[(index + i) % 4];
      const ranked = choices.map((midi) => ({
        midi,
        score:
          Math.abs(midi - target) +
          Math.abs(midi - base - 7) * 0.2 +
          rng() * 1.2,
      }));
      ranked.sort((a, b) => a.score - b.score);
      const midi =
        index === 7 && i === pattern.length - 1 ? base + 7 : ranked[0].midi;
      notes.push({
        tick: index * 8 + offset,
        midi,
        duration: Math.max(1, (pattern[i + 1] ?? 8) - offset - 1),
        velocity: (i === 0 ? 0.66 : 0.46) + rng() * 0.1,
      });
      previous = midi;
    });
  }
  return { cycle, stage, notes };
}

export type Drum = "kick" | "snare" | "hat";
export function beatAt(
  tick: number,
  rest = false,
): { drum: Drum; velocity: number }[] {
  const step = tick % 16;
  const result: { drum: Drum; velocity: number }[] = [];
  if (step === 0 || (!rest && step === 10))
    result.push({ drum: "kick", velocity: step === 0 ? 0.8 : 0.55 });
  if (step === 12 || (!rest && step === 4))
    result.push({ drum: "snare", velocity: 0.58 });
  if (step % (rest ? 4 : 2) === 0)
    result.push({ drum: "hat", velocity: step % 4 === 0 ? 0.3 : 0.2 });
  return result;
}

/** Eighth-note pairs lengthen/shorten equally, preserving every beat boundary. */
export function tickStretch(tick: number, lofi: boolean): number {
  return lofi ? (tick % 4 < 2 ? 1.16 : 0.84) : 1;
}
