export type TileId = string;
export type TileValue = string; // "a", "t", "qu", etc.

export interface Tile {
  id: TileId;
  value: TileValue;
}

export interface GridCell {
  tileId: TileId | null;
}

export type Grid = GridCell[][];

export interface GameState {
  dateKey: string;
  tiles: Tile[];
  rackTileIds: TileId[];
  grid: Grid;
}
