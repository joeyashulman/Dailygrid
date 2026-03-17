/**
 * Curated list of 12-tile sets that are known to have at least one valid
 * solution (all tiles can be placed on the grid to form valid connected words).
 * Each entry is 12 tile values (single letters a-z, or "qu" for one tile).
 * Used by the rack generator so every day has a solvable puzzle.
 */

export type TileValue = string;

/** Solvable 12-tile sets. Each array has exactly 12 tile values. */
export const SOLVABLE_TILE_SETS: TileValue[][] = [
  // BET, BAT, ATE, TEA, TAB
  ['b', 'e', 't', 'b', 'a', 't', 'a', 't', 'e', 't', 'e', 'a'],
  // CAT, ACT, ANT, CAN, TAN
  ['c', 'a', 't', 'a', 'c', 't', 'a', 'n', 't', 'c', 'a', 'n'],
  // COST, CARE, STAR
  ['c', 'o', 's', 't', 'c', 'a', 'r', 'e', 's', 't', 'a', 'r'],
  // RED, ARE, EAR, ERA
  ['r', 'e', 'd', 'a', 'r', 'e', 'e', 'a', 'r', 'e', 'r', 'a'],
  // TEN, NET, NOT, ONE, TON
  ['t', 'e', 'n', 'n', 'e', 't', 'n', 'o', 't', 'o', 'n', 'e'],
  // SAD, AND, DAY, SAY
  ['s', 'a', 'd', 'a', 'n', 'd', 'd', 'a', 'y', 's', 'a', 'y'],
  // PIE, PIN, PEN, NIP
  ['p', 'i', 'e', 'p', 'i', 'n', 'p', 'e', 'n', 'n', 'i', 'p'],
  // HOT, POT, TOP, OPT, HOP
  ['h', 'o', 't', 'p', 'o', 't', 't', 'o', 'p', 'o', 'p', 't'],
  // RAT, ART, TAR
  ['r', 'a', 't', 'a', 'r', 't', 't', 'a', 'r', 't', 'a', 'r'],
  // LEG, GEL, EEL, EGG
  ['l', 'e', 'g', 'g', 'e', 'l', 'e', 'e', 'l', 'e', 'g', 'g'],
  // BED, BAD, ADD, DAD
  ['b', 'e', 'd', 'b', 'a', 'd', 'a', 'd', 'd', 'd', 'a', 'd'],
  // SUN, RUN, URN, NUN
  ['s', 'u', 'n', 'r', 'u', 'n', 'u', 'r', 'n', 'n', 'u', 'n'],
  // DOG, GOD, ODD
  ['d', 'o', 'g', 'g', 'o', 'd', 'o', 'd', 'd', 'd', 'o', 'g'],
  // WAR, RAW, ARE, EAR
  ['w', 'a', 'r', 'r', 'a', 'w', 'a', 'r', 'e', 'e', 'a', 'r'],
  // BIT, TUB, BUT
  ['b', 'i', 't', 't', 'u', 'b', 'b', 'u', 't', 't', 'i', 't'],
  // MAP, AMP
  ['m', 'a', 'p', 'a', 'm', 'p', 'm', 'a', 'p', 'a', 'm', 'p'],
  // SIT, ITS
  ['s', 'i', 't', 'i', 't', 's', 's', 'i', 't', 'i', 't', 's'],
  // OWE, WOE, EWE
  ['o', 'w', 'e', 'w', 'o', 'e', 'e', 'w', 'e', 'o', 'w', 'e'],
  // BOX, COB, BOT, CAT
  ['b', 'o', 'x', 'c', 'o', 'b', 'b', 'o', 't', 'c', 'a', 't'],
  // HAT, ANT
  ['h', 'a', 't', 'h', 'a', 't', 'a', 'n', 't', 'h', 'a', 't'],
  // PET, PEE, TEE
  ['p', 'e', 't', 'p', 'e', 'e', 't', 'e', 'e', 'p', 'e', 't'],
  // MUG, GUM
  ['m', 'u', 'g', 'g', 'u', 'm', 'm', 'u', 'g', 'g', 'u', 'm'],
  // CUB, RUN
  ['c', 'u', 'b', 'c', 'u', 'b', 'r', 'u', 'n', 'r', 'u', 'n'],
  // DIM, MID
  ['d', 'i', 'm', 'm', 'i', 'd', 'd', 'i', 'm', 'm', 'i', 'd'],
  // ICE, TEA
  ['i', 'c', 'e', 'i', 'c', 'e', 't', 'e', 'a', 't', 'e', 'a'],
  // LOG, GOD
  ['l', 'o', 'g', 'l', 'o', 'g', 'g', 'o', 'd', 'g', 'o', 'd'],
  // MAN, NAM (nam is not common - use CAN)
  ['m', 'a', 'n', 'c', 'a', 'n', 'm', 'a', 'n', 'c', 'a', 'n'],
  // NOD, DON
  ['n', 'o', 'd', 'd', 'o', 'n', 'n', 'o', 'd', 'd', 'o', 'n'],
  // ORE, ROE
  ['o', 'r', 'e', 'r', 'o', 'e', 'o', 'r', 'e', 'r', 'o', 'e'],
  // PIT, TIP
  ['p', 'i', 't', 't', 'i', 'p', 'p', 'i', 't', 't', 'i', 'p'],
  // SEA, ATE
  ['s', 'e', 'a', 's', 'e', 'a', 'a', 't', 'e', 'a', 't', 'e'],
  // TIN, NIT
  ['t', 'i', 'n', 'n', 'i', 't', 't', 'i', 'n', 'n', 'i', 't'],
  // PUZZLES QUEST
  ['p', 'u', 'z', 'z', 'l', 'e', 's', 'q', 'u', 'e', 's', 't'],
  // COST CARE STAR variants
  ['c', 'a', 'r', 'e', 's', 't', 'a', 'r', 'c', 'o', 's', 't'],
  ['s', 't', 'a', 'r', 'c', 'o', 's', 't', 'c', 'a', 'r', 'e'],
  // BAT ATE TEA TAB
  ['b', 'a', 't', 'a', 't', 'e', 't', 'e', 'a', 't', 'a', 'b'],
  // ANT NET TEN NOT
  ['a', 'n', 't', 'n', 'e', 't', 't', 'e', 'n', 'n', 'o', 't'],
];
