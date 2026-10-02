/** Version 1 deterministic PRNG. Keep stable: shared URLs depend on it. */
export function hash(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) {
    value = Math.imul(value ^ text.charCodeAt(i), 16777619);
  }
  return value >>> 0;
}

export function random(seed: string): () => number {
  let state = hash(seed);
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(values: readonly T[], rng: () => number): T {
  return values[Math.floor(rng() * values.length)];
}
