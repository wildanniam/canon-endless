import { describe, expect, it } from "vitest";
import {
  parseSettings,
  PRESETS,
  readFavorites,
  sessionUrl,
} from "../src/settings";

describe("shareable sessions", () => {
  it("round trips every audible and visual setting including a seek position", () => {
    const settings = {
      ...parseSettings("?seed=abc"),
      key: "B♭" as const,
      mood: "wistful" as const,
      tempo: 47,
      density: 82,
      volume: 20,
      scene: "rain" as const,
      rotate: true,
      cycle: 99,
      mix: { ...PRESETS["Full ensemble"], melody: 15 },
    };
    const url = sessionUrl(
      settings,
      "https://example.com/canon/?old=1#fragment",
    );
    expect(url).not.toContain("old=");
    expect(url).not.toContain("#fragment");
    expect(new URL(url).pathname).toBe("/canon/");
    expect(new URL(url).searchParams.get("v")).toBe("1");
    expect(parseSettings(new URL(url).search)).toEqual(settings);
  });
  it("rejects unsafe seeds and unknown enum values; clamps numeric values", () => {
    const settings = parseSettings(
      "?seed=%3Cscript%3E&key=__proto__&mood=evil&scene=unknown&tempo=Infinity&density=-1&volume=999&cycle=1e99&bass=NaN",
    );
    expect(settings.seed).toBe("willow-2026");
    expect(settings.key).toBe("D");
    expect(settings.mood).toBe("bright");
    expect(settings.scene).toBe("lake");
    expect(settings.tempo).toBe(72);
    expect(settings.density).toBe(0);
    expect(settings.volume).toBe(100);
    expect(settings.cycle).toBe(1_000_000);
    expect(settings.mix.bass).toBe(55);
  });
  it("does not turn empty parameters into zero or accept inherited key names", () => {
    expect(parseSettings("?tempo=&volume=&key=constructor").tempo).toBe(72);
    expect(parseSettings("?tempo=&volume=&key=constructor").volume).toBe(65);
    expect(parseSettings("?tempo=&volume=&key=constructor").key).toBe("D");
  });
  it("keeps preset objects independent across sessions", () => {
    const a = parseSettings("");
    const b = parseSettings("");
    a.mix.melody = 0;
    expect(b.mix.melody).toBe(80);
    expect(PRESETS["Classic quartet"].melody).toBe(80);
  });
});

describe("local favorites", () => {
  it("recovers from blocked or corrupt storage", () => {
    expect(
      readFavorites({
        getItem: () => {
          throw new Error("Blocked");
        },
      }),
    ).toEqual([]);
    expect(readFavorites({ getItem: () => "{bad" })).toEqual([]);
    expect(readFavorites({ getItem: () => "null" })).toEqual([]);
  });
  it("filters malformed entries and caps history", () => {
    const valid = {
      seed: "willow-a",
      query: "?seed=willow-a",
      savedAt: "2026-10-03",
    };
    const entries = [
      null,
      { ...valid, seed: "<img>" },
      { ...valid, query: 3 },
      ...Array(30).fill(valid),
    ];
    expect(
      readFavorites({ getItem: () => JSON.stringify(entries) }),
    ).toHaveLength(20);
  });
});
