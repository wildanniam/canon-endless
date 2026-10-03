import { describe, expect, it } from "vitest";
import { Canon, compose } from "../src/music/composer";
import { beatAt, tickStretch } from "../src/music/lofi";
import { KEYS, progression, scaleNotes } from "../src/music/theory";
import type { Mood } from "../src/music/theory";
import { parseSettings, PRESETS, sessionUrl } from "../src/settings";

describe("lo-fi arrangement", () => {
  it("preserves Classic phrases and isolates cached styles", () => {
    const classic = parseSettings("?seed=old-link");
    const lofi = { ...classic, style: "lofi" as const };
    const canon = new Canon();
    expect(compose(classic, 4)).toEqual(
      compose({ ...classic, style: undefined }, 4),
    );
    expect(canon.phrase(lofi, 4)).not.toEqual(canon.phrase(classic, 4));
    expect(canon.phrase(lofi, 4)).toEqual(compose(lofi, 4));
    expect(compose(lofi, 4)).toMatchSnapshot("lo-fi-v1");
  });
  it("keeps sparse syncopated notes inside each harmony across keys/moods/densities", () => {
    for (const key of Object.keys(KEYS) as (keyof typeof KEYS)[])
      for (const mood of ["bright", "wistful", "dreamy"] as Mood[])
        for (const density of [0, 40, 100])
          for (let cycle = 0; cycle < 24; cycle++) {
            const config = {
              seed: "lofi-invariants",
              key,
              mood,
              density,
              style: "lofi" as const,
            };
            const phrase = compose(config, cycle);
            const chords = progression(key, mood);
            expect(phrase.notes.length).toBeGreaterThan(0);
            expect(
              phrase.notes.reduce((sum, n) => sum + n.duration, 0),
            ).toBeLessThan(64);
            phrase.notes.forEach((n, i) => {
              const chord = Math.floor(n.tick / 8);
              expect(n.duration).toBeGreaterThan(0);
              expect(n.tick + n.duration).toBeLessThanOrEqual((chord + 1) * 8);
              expect(scaleNotes(key, mood, chord)).toContain(n.midi);
              if (n.tick % 8 === 0)
                expect(chords[chord].notes).toContain(n.midi % 12);
              if (i > 0)
                expect(n.tick).toBeGreaterThanOrEqual(
                  phrase.notes[i - 1].tick + phrase.notes[i - 1].duration,
                );
            });
          }
  });
  it("replays exact delayed lo-fi voices", () => {
    const canon = new Canon(),
      config = parseSettings("?style=lofi&seed=echo");
    for (let tick = 0; tick < 64; tick++) {
      const voice = canon
        .notesAt(config, 1, tick)
        .filter((n) => n.voice === 1)
        .map((n) => ({
          tick: n.tick,
          duration: n.duration,
          midi: n.midi,
          velocity: n.velocity,
        }));
      expect(voice).toEqual(
        canon.phrase(config, 0).notes.filter((n) => n.tick === tick),
      );
    }
  });
  it("swings eighths without changing beat/bar length", () => {
    expect(
      Array.from({ length: 64 }, (_, i) => tickStretch(i, true)).reduce(
        (a, b) => a + b,
        0,
      ),
    ).toBeCloseTo(64);
    for (let i = 0; i < 64; i += 4) {
      expect(tickStretch(i, true) + tickStretch(i + 1, true)).toBeCloseTo(2.32);
      expect(tickStretch(i + 2, true) + tickStretch(i + 3, true)).toBeCloseTo(
        1.68,
      );
      expect(tickStretch(i, false)).toBe(1);
    }
  });
  it("places the snare on beats two and four and simplifies rest", () => {
    const snare = Array.from({ length: 16 }, (_, i) =>
      beatAt(i).some((h) => h.drum === "snare") ? i : -1,
    ).filter((i) => i >= 0);
    expect(snare).toEqual([4, 12]);
    expect(beatAt(10, true)).toEqual([]);
    expect(beatAt(0, true).map((h) => h.drum)).toEqual(["kick", "hat"]);
  });
  it("round-trips style, drums and vinyl while old URLs remain Classic", () => {
    const lofi = parseSettings("?style=lofi&beat=34&vinyl=9");
    expect(lofi.tempo).toBe(68);
    expect(
      parseSettings(
        new URL(sessionUrl(lofi, "https://example.com/canon/")).search,
      ),
    ).toEqual(lofi);
    const old = parseSettings("?seed=classic&style=invalid");
    expect(old.style).toBe("classic");
    expect(old.mix.beat).toBe(0);
    expect(old.mix.vinyl).toBe(0);
    expect(old.tempo).toBe(72);
    expect(parseSettings("?style=lofi").mix).toEqual(
      PRESETS["Lo-fi afternoon"],
    );
  });
});
