import { describe, expect, it } from "vitest";
import { Canon, compose, stageAt } from "../src/music/composer";
import {
  frequency,
  KEYS,
  progression,
  scaleNotes,
  TICKS_PER_CYCLE,
} from "../src/music/theory";
import type { Key, Mood } from "../src/music/theory";
import { random } from "../src/music/random";

const config = {
  seed: "willow-1234",
  key: "D" as const,
  mood: "bright" as const,
  density: 40,
};

describe("Canon harmony", () => {
  it("uses the correct major and wistful progressions", () => {
    expect(progression("D", "bright").map((c) => c.name)).toEqual([
      "D",
      "A",
      "Bm",
      "F♯m",
      "G",
      "D",
      "G",
      "A",
    ]);
    expect(progression("D", "wistful").map((c) => c.name)).toEqual([
      "Dm",
      "Am",
      "B♭",
      "F",
      "Gm",
      "Dm",
      "Gm",
      "A",
    ]);
  });
  it("transposes every chord interval consistently in all keys", () => {
    for (const key of Object.keys(KEYS) as Key[]) {
      expect(
        progression(key, "bright").map((c) => (c.root - KEYS[key] + 12) % 12),
      ).toEqual([0, 7, 9, 4, 5, 0, 5, 7]);
    }
  });
  it("raises the seventh for the final minor-mode dominant only", () => {
    expect(scaleNotes("D", "wistful", 1)).toContain(72);
    expect(scaleNotes("D", "wistful", 7)).not.toContain(72);
    expect(scaleNotes("D", "wistful", 7)).toContain(73);
    expect(frequency(69)).toBe(440);
  });
});

describe("deterministic composition", () => {
  it("replays exactly and varies with the seed and cycle", () => {
    expect(compose(config, 7)).toEqual(compose(config, 7));
    expect(compose(config, 7).notes).not.toEqual(compose(config, 8).notes);
    expect(compose(config, 7).notes).not.toEqual(
      compose({ ...config, seed: "river-5678" }, 7).notes,
    );
  });
  it("locks the v1 pseudo-random sequence used by shared sessions", () => {
    const rng = random("endless-v1");
    const values = Array.from({ length: 4 }, rng);
    expect(values).toMatchInlineSnapshot(`
      [
        0.6120266288053244,
        0.4153823321685195,
        0.7315539831761271,
        0.9073837373871356,
      ]
    `);
  });
  it("locks an initial v1 phrase so algorithm changes require explicit versioning", () => {
    expect(compose(config, 0)).toMatchSnapshot();
  });
  for (const mood of ["bright", "dreamy", "wistful"] as Mood[]) {
    it(`anchors strong beats, stays in range and fills 4 bars in ${mood}`, () => {
      for (const key of Object.keys(KEYS) as Key[]) {
        for (const density of [0, 40, 100]) {
          for (let cycle = 0; cycle < 48; cycle++) {
            const phrase = compose({ ...config, key, mood, density }, cycle);
            const chords = progression(key, mood);
            let tick = 0;
            for (const note of phrase.notes) {
              expect(note.tick).toBe(tick);
              expect(note.duration).toBeGreaterThan(0);
              expect((note.tick % 8) + note.duration).toBeLessThanOrEqual(8);
              expect(note.midi).toBeGreaterThanOrEqual(60 + KEYS[key]);
              expect(note.midi).toBeLessThanOrEqual(84 + KEYS[key]);
              const chordIndex = Math.floor(tick / 8);
              expect(scaleNotes(key, mood, chordIndex)).toContain(note.midi);
              if (tick % 8 === 0)
                expect(chords[chordIndex].notes).toContain(note.midi % 12);
              tick += note.duration;
            }
            expect(tick).toBe(TICKS_PER_CYCLE);
            expect(phrase.notes.at(-1)!.midi).toBe(67 + KEYS[key]);
          }
        }
      }
    });
  }
  it("keeps the melodic line predominantly stepwise", () => {
    const notes = Array.from(
      { length: 48 },
      (_, cycle) => compose(config, cycle).notes,
    );
    let small = 0,
      total = 0;
    for (const phrase of notes)
      for (let i = 1; i < phrase.length - 1; i++) {
        if (Math.abs(phrase[i].midi - phrase[i - 1].midi) <= 4) small++;
        total++;
      }
    expect(small / total).toBeGreaterThan(0.8);
  });
  it("allows direct seeking without generating the entire preceding history", () => {
    const first = compose(config, 1_000_000);
    expect(first.notes.length).toBeGreaterThan(0);
    expect(first).toEqual(compose(config, 1_000_000));
  });
});

describe("voice entrances and stage evolution", () => {
  it("starts with one voice and adds exact echoes one cycle apart", () => {
    const canon = new Canon();
    expect(canon.notesAt(config, 0, 0).map((n) => n.voice)).toEqual([0]);
    expect(canon.notesAt(config, 1, 0).map((n) => n.voice)).toEqual([0, 1]);
    expect(canon.notesAt(config, 2, 0).map((n) => n.voice)).toEqual([0, 1, 2]);
    for (let tick = 0; tick < 64; tick++) {
      const original = canon
        .notesAt(config, 0, tick)
        .filter((n) => n.voice === 0)
        .map((n) => [n.tick, n.duration, n.midi, n.velocity]);
      const echoed = canon
        .notesAt(config, 2, tick)
        .filter((n) => n.voice === 2)
        .map((n) => [n.tick, n.duration, n.midi, n.velocity]);
      expect(echoed).toEqual(original);
    }
  });
  it("evolves through six stages with 2–6 cycles each, and rests with two voices", () => {
    const canon = new Canon();
    for (let epoch = 0; epoch < 30; epoch++) {
      const stages = Array.from({ length: 24 }, (_, i) =>
        stageAt(config.seed, epoch * 24 + i),
      );
      expect([...stages].sort()).toEqual(stages);
      for (let stage = 0; stage < 6; stage++) {
        const count = stages.filter((s) => s === stage).length;
        expect(count).toBeGreaterThanOrEqual(2);
        expect(count).toBeLessThanOrEqual(6);
      }
      const rest = epoch * 24 + stages.indexOf(5);
      expect(canon.notesAt(config, rest, 0).map((n) => n.voice)).toEqual([
        0, 1,
      ]);
    }
  });
  it("holds at most twelve phrases across 10,000 cycles and changing settings", () => {
    const canon = new Canon();
    for (let cycle = 0; cycle < 10_000; cycle++) {
      canon.notesAt({ ...config, density: cycle % 101 }, cycle, 0);
      expect(canon.size).toBeLessThanOrEqual(12);
    }
  });
});
