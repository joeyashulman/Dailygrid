import type { Tile } from './types';

const RACK_SIZE = 12;
const MAX_PER_LETTER = 2;

/**
 * Bananagrams-inspired letter frequencies.
 * Values are relative weights, not exact counts.
 * Source distribution roughly:
 * A:13, B:3, C:3, D:6, E:18, F:3, G:4, H:3, I:12, J:2, K:2, L:5,
 * M:3, N:8, O:11, P:3, Q:2, R:9, S:6, T:9, U:6, V:3, W:3, X:2, Y:3, Z:2
 * We also treat "qu" as a special consonant tile.
 */
type LetterWeight = {
  letter: string;
  weight: number;
};

const VOWEL_WEIGHTS: LetterWeight[] = [
  { letter: 'a', weight: 13 },
  { letter: 'e', weight: 18 },
  { letter: 'i', weight: 12 },
  { letter: 'o', weight: 11 },
  { letter: 'u', weight: 6 },
];

const CONSONANT_WEIGHTS: LetterWeight[] = [
  { letter: 'b', weight: 3 },
  { letter: 'c', weight: 3 },
  { letter: 'd', weight: 6 },
  { letter: 'f', weight: 3 },
  { letter: 'g', weight: 4 },
  { letter: 'h', weight: 3 },
  { letter: 'j', weight: 2 },
  { letter: 'k', weight: 2 },
  { letter: 'l', weight: 5 },
  { letter: 'm', weight: 3 },
  { letter: 'n', weight: 8 },
  { letter: 'p', weight: 3 },
  { letter: 'qu', weight: 2 },
  { letter: 'r', weight: 9 },
  { letter: 's', weight: 6 },
  { letter: 't', weight: 9 },
  { letter: 'v', weight: 3 },
  { letter: 'w', weight: 3 },
  { letter: 'x', weight: 2 },
  { letter: 'y', weight: 3 },
  { letter: 'z', weight: 2 },
];

// Rare consonants we want to limit per rack.
const RARE_CONSONANTS = new Set<string>(['j', 'qu', 'x', 'z']);
const MAX_RARE_CONSONANTS_PER_RACK = 2;

/** Deterministic seeded RNG (mulberry32). Returns 0..1. */
function seededRandom(seed: number): () => number {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash a string to a number. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i);
    h = h | 0;
  }
  return Math.abs(h);
}

function shuffleWith<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Pick a letter from a weighted pool, respecting MAX_PER_LETTER.
 * Returns null if no letters are available under the limit.
 */
function pickWeightedLetter(
  pool: LetterWeight[],
  rng: () => number,
  counts: Record<string, number>
): string | null {
  const available = pool.filter((entry) => (counts[entry.letter] ?? 0) < MAX_PER_LETTER);
  if (available.length === 0) {
    return null;
  }
  const totalWeight = available.reduce((sum, entry) => sum + entry.weight, 0);
  let r = rng() * totalWeight;
  for (const entry of available) {
    if (r < entry.weight) {
      return entry.letter;
    }
    r -= entry.weight;
  }
  // Fallback: should not happen, but return last available letter for safety.
  return available[available.length - 1].letter;
}

/**
 * Generate 12 random tile values using a Bananagrams-inspired distribution:
 * - 2–3 vowels per rack (chosen with weighted probabilities)
 * - Remaining tiles are consonants, also weighted
 * - At most MAX_PER_LETTER (2) of any letter (including "qu") in the rack
 * Deterministic for a given seed.
 */
function generateRandomTileValues(seed: number): string[] {
  const rng = seededRandom(seed);

  // Decide vowel count: bias slightly toward 3 while allowing 2.
  const vowelCount = rng() < 0.4 ? 2 : 3; // 40% -> 2 vowels, 60% -> 3 vowels

  const counts: Record<string, number> = {};
  let rareConsonantCount = 0;
  const values: string[] = [];

  // Pick vowels.
  for (let i = 0; i < vowelCount; i++) {
    const picked = pickWeightedLetter(VOWEL_WEIGHTS, rng, counts);
    if (!picked) break;
    counts[picked] = (counts[picked] ?? 0) + 1;
    values.push(picked);
  }

  // Fill remaining slots with consonants.
  while (values.length < RACK_SIZE) {
    const picked = pickWeightedLetter(CONSONANT_WEIGHTS, rng, counts);
    if (!picked) {
      // No consonants available under MAX_PER_LETTER; stop early.
      break;
    }
    if (RARE_CONSONANTS.has(picked) && rareConsonantCount >= MAX_RARE_CONSONANTS_PER_RACK) {
      // Skip this pick and try again with a fresh roll.
      continue;
    }
    counts[picked] = (counts[picked] ?? 0) + 1;
    if (RARE_CONSONANTS.has(picked)) {
      rareConsonantCount += 1;
    }
    values.push(picked);
  }

  shuffleWith(values, rng);
  return values;
}

/**
 * Returns the 12 tiles for the given date key. Deterministic: same dateKey => same tiles for everyone.
 * Uses a Bananagrams-inspired distribution: 2–3 vowels, weighted consonants, max 2 per letter (no solvability check).
 */
export function generateRackForDate(dateKey: string): Tile[] {
  const seed = hashString(dateKey);
  const values = generateRandomTileValues(seed);

  if (values.length !== 12) {
    const fallback = generateRandomTileValues(seed + 1);
    const use = fallback.length === 12 ? fallback : values;
    const rng = seededRandom(seed + 2);
    shuffleWith(use, rng);
    return use.map((value, i) => ({ id: `${dateKey}-${i}-${value}`, value }));
  }

  const rng = seededRandom(seed + 1);
  shuffleWith(values, rng);
  return values.map((value, i) => ({ id: `${dateKey}-${i}-${value}`, value }));
}

/** Current date as YYYY-MM-DD in local time. */
export function getTodayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
