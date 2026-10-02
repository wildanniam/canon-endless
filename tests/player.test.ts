import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseSettings } from "../src/settings";
import { Player } from "../src/audio/player";

const harness = vi.hoisted(() => ({
  workers: [] as {
    onmessage?: () => void;
    terminate: ReturnType<typeof vi.fn>;
  }[],
  banks: [] as {
    fadeTo: ReturnType<typeof vi.fn>;
    silence: ReturnType<typeof vi.fn>;
  }[],
}));
vi.mock("../src/audio/timer.worker?worker", () => ({
  default: class {
    onmessage?: () => void;
    postMessage = vi.fn();
    terminate = vi.fn();
    constructor() {
      harness.workers.push(this);
    }
  },
}));
vi.mock("../src/audio/synth", () => ({
  SoundBank: class {
    fadeTo = vi.fn();
    silence = vi.fn();
    mix = vi.fn();
    scene = vi.fn();
    note = vi.fn();
    dispose = vi.fn();
    activeNodes = 0;
    constructor() {
      harness.banks.push(this);
    }
  },
}));

class FakeContext {
  static current: FakeContext;
  currentTime = 0;
  state = "suspended";
  outputLatency = 0;
  onstatechange?: () => void;
  constructor() {
    FakeContext.current = this;
  }
  async resume() {
    this.state = "running";
  }
  async suspend() {
    this.state = "suspended";
  }
  async close() {
    this.state = "closed";
  }
}

function advance(time: number) {
  FakeContext.current.currentTime = time;
  harness.workers.at(-1)?.onmessage?.();
}

beforeEach(() => {
  harness.banks.length = 0;
  harness.workers.length = 0;
  vi.stubGlobal("AudioContext", FakeContext);
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 1),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});
afterEach(() => vi.unstubAllGlobals());

describe("smooth transport changes", () => {
  it("fades the old harmony out before resetting and fading in the new one", async () => {
    const settings = parseSettings("");
    const player = new Player(settings);
    await player.play();
    player.update({ ...settings, key: "G" }, true);
    expect(player.diagnostics.key).toBe("D");
    expect(player.diagnostics.transitioning).toBe(true);
    expect(harness.banks[0].fadeTo).toHaveBeenLastCalledWith(0, 0.26);
    advance(0.25);
    expect(harness.banks[0].silence).not.toHaveBeenCalled();
    advance(0.31);
    expect(player.diagnostics.key).toBe("G");
    expect(harness.banks[0].silence).toHaveBeenCalledTimes(1);
    expect(harness.banks[0].fadeTo).toHaveBeenLastCalledWith(1, 0.85);
    expect(player.diagnostics.transitioning).toBe(false);
  });

  it("coalesces rapid tonal changes into the last selection", async () => {
    const settings = parseSettings("");
    const player = new Player(settings);
    const applied = vi.fn();
    player.onSettingsApplied = applied;
    await player.play();
    player.update({ ...settings, key: "A" }, true);
    advance(0.1);
    player.update(
      { ...settings, key: "F", mood: "wistful", density: 90 },
      true,
    );
    expect(
      harness.banks[0].fadeTo.mock.calls.filter((args) => args[1] === 0.26),
    ).toHaveLength(1);
    advance(0.31);
    expect(player.activeSettings).toMatchObject({
      key: "F",
      mood: "wistful",
      density: 90,
    });
    advance(1);
    expect(applied).toHaveBeenCalledTimes(1);
    expect(harness.banks[0].silence).toHaveBeenCalledTimes(1);
  });

  it("keeps volume/mix edits without leaking a pending key into the old phrase", async () => {
    const settings = parseSettings("");
    const player = new Player(settings);
    await player.play();
    const next = {
      ...settings,
      key: "G" as const,
      volume: 12,
      mix: { ...settings.mix, bass: 0 },
    };
    player.update(next, true);
    player.update(next);
    expect(player.activeSettings).toMatchObject({
      key: "D",
      volume: 12,
      mix: { bass: 0 },
    });
    advance(0.31);
    expect(player.activeSettings).toMatchObject({
      key: "G",
      volume: 12,
      mix: { bass: 0 },
    });
  });

  it("does not apply an uncommitted density drag through a scene/mix update", async () => {
    const settings = parseSettings("");
    const player = new Player(settings);
    await player.play();
    player.update({ ...settings, density: 100, scene: "rain" });
    expect(player.activeSettings).toMatchObject({ density: 40, scene: "rain" });
  });

  it("applies silent settings without initializing or starting audio", () => {
    const settings = parseSettings("");
    const player = new Player(settings);
    player.update({ ...settings, key: "C", mood: "dreamy" }, true);
    expect(player.diagnostics).toMatchObject({
      context: "uninitialized",
      playing: false,
      key: "C",
      transitioning: false,
    });
    expect(harness.banks).toHaveLength(0);
  });

  it("settles a pending change on pause and resumes without a stale reset", async () => {
    const settings = parseSettings("");
    const player = new Player(settings);
    await player.play();
    player.update({ ...settings, key: "A" }, true);
    await player.pause();
    expect(player.diagnostics).toMatchObject({
      playing: false,
      context: "suspended",
      key: "A",
      transitioning: false,
    });
    expect(harness.banks[0].fadeTo).toHaveBeenLastCalledWith(1, 0);
    await player.play();
    advance(0.6);
    expect(harness.banks[0].silence).toHaveBeenCalledTimes(1);
    expect(player.diagnostics).toMatchObject({ playing: true, key: "A" });
  });

  it("settles pending changes after a browser audio interruption", async () => {
    const settings = parseSettings("");
    const player = new Player(settings);
    const interrupted = vi.fn();
    player.onInterrupted = interrupted;
    await player.play();
    player.update({ ...settings, key: "F" }, true);
    FakeContext.current.state = "suspended";
    FakeContext.current.onstatechange?.();
    expect(player.diagnostics).toMatchObject({
      playing: false,
      key: "F",
      transitioning: false,
    });
    expect(interrupted).toHaveBeenCalledOnce();
  });

  it("glides tempo instead of jumping, including retargeting mid-glide", async () => {
    const settings = parseSettings("");
    const player = new Player(settings);
    await player.play();
    player.update({ ...settings, tempo: 120 });
    expect(player.diagnostics.tempo).toBe(72);
    advance(0.45);
    expect(player.diagnostics.tempo).toBeCloseTo(96);
    player.update({ ...settings, tempo: 40 });
    expect(player.diagnostics.tempo).toBeCloseTo(96);
    advance(1.4);
    expect(player.diagnostics.tempo).toBe(40);
  });

  it("fades a rewind and retains its requested position during a key change", async () => {
    const settings = parseSettings("?cycle=5");
    const player = new Player(settings);
    await player.play();
    player.seek(4);
    player.update({ ...settings, key: "G" }, true);
    expect(player.cycle).toBe(5);
    advance(0.31);
    expect(player.cycle).toBe(4);
    expect(player.activeSettings.key).toBe("G");
  });
});
