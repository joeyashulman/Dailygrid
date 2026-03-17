/**
 * Solver to check if a set of 12 tiles can be placed on the grid to form
 * valid connected words (all runs 3+ letters, all valid words, all tiles connected).
 */

const GRID_SIZE = 12;
const MIN_WORD_LENGTH = 3;
const MAX_PLACEMENT_ATTEMPTS = 300_000;

type Grid = (string | null)[][];

function makeEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null)
  );
}

function getHorizontalRun(grid: Grid, r: number, c: number): { word: string; length: number } {
  let start = c;
  let end = c;
  while (start > 0 && grid[r][start - 1] !== null) start--;
  while (end < GRID_SIZE - 1 && grid[r][end + 1] !== null) end++;
  const word = Array.from({ length: end - start + 1 }, (_, i) => grid[r][start + i]).join('');
  return { word, length: end - start + 1 };
}

function getVerticalRun(grid: Grid, r: number, c: number): { word: string; length: number } {
  let start = r;
  let end = r;
  while (start > 0 && grid[start - 1][c] !== null) start--;
  while (end < GRID_SIZE - 1 && grid[end + 1][c] !== null) end++;
  const word = Array.from({ length: end - start + 1 }, (_, i) => grid[start + i][c]).join('');
  return { word, length: end - start + 1 };
}

function getFilledCells(grid: Grid): [number, number][] {
  const out: [number, number][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x] !== null) out.push([y, x]);
    }
  }
  return out;
}

function getEmptyAdjacentCells(grid: Grid): [number, number][] {
  const filled = getFilledCells(grid);
  const emptyAdj = new Set<string>();
  const add = (r: number, c: number) => {
    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && grid[r][c] === null) {
      emptyAdj.add(`${r},${c}`);
    }
  };
  if (filled.length === 0) {
    const center = Math.floor(GRID_SIZE / 2);
    return [[center, center]];
  }
  for (const [r, c] of filled) {
    add(r - 1, c);
    add(r + 1, c);
    add(r, c - 1);
    add(r, c + 1);
  }
  return Array.from(emptyAdj).map((s) => {
    const [r, c] = s.split(',').map(Number);
    return [r, c] as [number, number];
  });
}

function isConnected(grid: Grid): boolean {
  const filled = getFilledCells(grid);
  if (filled.length <= 1) return true;
  const set = new Set(filled.map(([r, c]) => `${r},${c}`));
  const start = filled[0];
  const q: [number, number][] = [start];
  const visited = new Set<string>([`${start[0]},${start[1]}`]);
  while (q.length > 0) {
    const [r, c] = q.shift()!;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (set.has(key) && !visited.has(key)) {
        visited.add(key);
        q.push([nr, nc]);
      }
    }
  }
  return visited.size === filled.length;
}

async function allRunsValid(
  grid: Grid,
  checkWord: (w: string) => Promise<boolean>
): Promise<boolean> {
  const seenHoriz = new Set<string>();
  const seenVert = new Set<string>();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === null) continue;
      const h = getHorizontalRun(grid, r, c);
      const keyH = `${r},${h.word}`;
      if (!seenHoriz.has(keyH)) {
        seenHoriz.add(keyH);
        if (h.length < MIN_WORD_LENGTH) return false; // no 1- or 2-letter runs in final grid
        if (!(await checkWord(h.word))) return false;
      }
      const v = getVerticalRun(grid, r, c);
      const keyV = `${v.word},${c}`;
      if (!seenVert.has(keyV)) {
        seenVert.add(keyV);
        if (v.length < MIN_WORD_LENGTH) return false;
        if (!(await checkWord(v.word))) return false;
      }
    }
  }
  return true;
}

let placementAttempts: number;

async function solve(
  grid: Grid,
  remaining: string[],
  checkWord: (w: string) => Promise<boolean>
): Promise<boolean> {
  if (placementAttempts >= MAX_PLACEMENT_ATTEMPTS) return false;

  if (remaining.length === 0) {
    return isConnected(grid) && (await allRunsValid(grid, checkWord));
  }

  const candidates = getEmptyAdjacentCells(grid);
  for (const [r, c] of candidates) {
    for (let i = 0; i < remaining.length; i++) {
      placementAttempts++;
      if (placementAttempts >= MAX_PLACEMENT_ATTEMPTS) return false;

      const letter = remaining[i];
      grid[r][c] = letter;

      const h = getHorizontalRun(grid, r, c);
      const v = getVerticalRun(grid, r, c);
      // Only require runs of 3+ to be valid words (incomplete 2-letter runs are ok while building)
      let valid = true;
      if (h.length >= MIN_WORD_LENGTH && !(await checkWord(h.word))) valid = false;
      if (valid && v.length >= MIN_WORD_LENGTH && !(await checkWord(v.word))) valid = false;
      if (!valid) {
        grid[r][c] = null;
        continue;
      }

      const rest = remaining.slice(0, i).concat(remaining.slice(i + 1));
      if (await solve(grid, rest, checkWord)) {
        return true;
      }
      grid[r][c] = null;
    }
  }
  return false;
}

/**
 * Returns true if the given 12 tile values can be placed on a 12x12 grid
 * so that every horizontal/vertical run of 3+ letters is a valid word and all tiles are connected.
 */
export async function canFormValidGrid(
  tileValues: string[],
  checkWord: (w: string) => Promise<boolean>
): Promise<boolean> {
  if (tileValues.length !== 12) return false;
  placementAttempts = 0;
  const grid = makeEmptyGrid();
  return solve(grid, [...tileValues], checkWord);
}
