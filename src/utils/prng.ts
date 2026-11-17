export type SeedInput = number | string;

export interface DeterministicRng {
  /** Returns a uniform pseudo-random float in [0, 1). */
  next: () => number;
  /** Returns a uniform float in [min, max). Swaps bounds if min > max. */
  range: (min: number, max: number) => number;
  /** Returns an integer in [minInclusive, maxInclusive]. */
  int: (minInclusive: number, maxInclusive: number) => number;
  /** Picks a deterministic item from a non-empty readonly array. */
  pick: <T>(items: readonly T[]) => T;
  /** Standard normal variate (mean 0, stdDev 1) via Box-Muller transform. */
  gaussian: () => number;
}

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const DEFAULT_NON_ZERO_SEED = 0x9e3779b9;

/**
 * Normalizes a numeric or string seed into an unsigned non-zero 32-bit integer.
 */
export function normalizeSeed(seed: SeedInput): number {
  if (typeof seed === 'string') {
    let hash = FNV_OFFSET_BASIS;
    for (let i = 0; i < seed.length; i += 1) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, FNV_PRIME);
    }
    const unsigned = hash >>> 0;
    return unsigned === 0 ? DEFAULT_NON_ZERO_SEED : unsigned;
  }

  if (!Number.isFinite(seed)) {
    return DEFAULT_NON_ZERO_SEED;
  }

  const unsigned = (Math.trunc(seed) >>> 0);
  return unsigned === 0 ? DEFAULT_NON_ZERO_SEED : unsigned;
}

/**
 * Creates a deterministic Mulberry32 PRNG instance.
 * Never delegates to Math.random().
 */
export function createSeededRng(seed: SeedInput): DeterministicRng {
  let state = normalizeSeed(seed);

  const next = (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const range = (min: number, max: number): number => {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new RangeError('PRNG range bounds must be finite numbers.');
    }
    if (min === max) {
      return min;
    }
    const low = Math.min(min, max);
    const high = Math.max(min, max);
    return low + next() * (high - low);
  };

  const int = (minInclusive: number, maxInclusive: number): number => {
    if (!Number.isFinite(minInclusive) || !Number.isFinite(maxInclusive)) {
      throw new RangeError('PRNG int bounds must be finite numbers.');
    }
    const low = Math.ceil(Math.min(minInclusive, maxInclusive));
    const high = Math.floor(Math.max(minInclusive, maxInclusive));
    if (low >= high) {
      return low;
    }
    return low + Math.floor(next() * (high - low + 1));
  };

  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) {
      throw new RangeError('Cannot pick an element from an empty array.');
    }
    return items[Math.floor(next() * items.length)];
  };

  const gaussian = (): number => {
    const u1 = Math.max(next(), 1e-12);
    const u2 = next();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };

  return { next, range, int, pick, gaussian };
}

