import type { GameState, Grid } from './types';

export interface LiveValidation {
  invalidWordCells: Set<string>;
  validWordCells: Set<string>;
  hasShortWord: boolean;
  isConnected: boolean;
}

const MIN_WORD_LENGTH = 3;

interface Segment {
  coords: [number, number][];
  text: string;
}

function extractSegments(
  grid: Grid,
  tileLookup: (tileId: string) => string,
  orientation: 'horizontal' | 'vertical'
): Segment[] {
  const segments: Segment[] = [];
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const outerLimit = orientation === 'horizontal' ? h : w;
  const innerLimit = orientation === 'horizontal' ? w : h;

  for (let outer = 0; outer < outerLimit; outer++) {
    let currentCoords: [number, number][] = [];
    let currentText = '';

    for (let inner = 0; inner < innerLimit; inner++) {
      const x = orientation === 'horizontal' ? inner : outer;
      const y = orientation === 'horizontal' ? outer : inner;
      const cell = grid[y][x];

      if (cell.tileId) {
        currentCoords.push([x, y]);
        currentText += tileLookup(cell.tileId);
      } else {
        if (currentText.length > 0) {
          segments.push({ coords: currentCoords, text: currentText });
        }
        currentCoords = [];
        currentText = '';
      }
    }
    if (currentText.length > 0) {
      segments.push({ coords: currentCoords, text: currentText });
    }
  }

  return segments;
}

function computeConnectivity(grid: Grid): boolean {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  let start: [number, number] | null = null;
  let filledCount = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (grid[y][x].tileId) {
        filledCount++;
        if (!start) start = [x, y];
      }
    }
  }

  if (!start || filledCount === 0) return filledCount === 0;

  const visited = new Set<string>();
  const q: [number, number][] = [start];
  visited.add(`${start[0]}-${start[1]}`);

  const dirs: [number, number][] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  while (q.length > 0) {
    const [x, y] = q.shift()!;
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      if (!grid[ny][nx].tileId) continue;
      const key = `${nx}-${ny}`;
      if (!visited.has(key)) {
        visited.add(key);
        q.push([nx, ny]);
      }
    }
  }

  return visited.size === filledCount;
}

export type CheckWordFn = (word: string) => Promise<boolean>;

/**
 * Async version of live validation using an async word check (e.g. dictionary API).
 */
export async function computeLiveValidationAsync(
  state: GameState,
  checkWord: CheckWordFn
): Promise<LiveValidation> {
  const tileMap = new Map(state.tiles.map((t) => [t.id, t.value]));
  const lookup = (id: string) => tileMap.get(id) ?? '';

  const grid = state.grid;
  const horiz = extractSegments(grid, lookup, 'horizontal');
  const vert = extractSegments(grid, lookup, 'vertical');
  const allSegs = [...horiz, ...vert];

  // Relaxed rule: we don't treat 1–2 letter runs as an automatic failure.
  // Only invalid 3+ letter segments and disconnected tiles block a win.
  const hasShortWord = false;

  const invalidWordCells = new Set<string>();
  const validWordCells = new Set<string>();

  for (const seg of allSegs) {
    const len = seg.text.length;
    if (len >= MIN_WORD_LENGTH) {
      const valid = await checkWord(seg.text);
      if (valid) {
        for (const [x, y] of seg.coords) {
          validWordCells.add(`${x}-${y}`);
        }
      } else {
        for (const [x, y] of seg.coords) {
          invalidWordCells.add(`${x}-${y}`);
        }
      }
    }
  }

  const isConnected = computeConnectivity(grid);

  return { invalidWordCells, validWordCells, hasShortWord, isConnected };
}
