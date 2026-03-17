import type { MutableRefObject } from 'react';
import type { GameState, Grid as GridType } from '../game/types';

interface Props {
  state: GameState;
  onTileDrop: (tileId: string, x: number, y: number) => void;
  onReturnTileToRack: (tileId: string) => void;
  onDragStart: (tileId: string, value: string, clientX: number, clientY: number) => void;
  onDragMove: (clientX: number, clientY: number) => void;
  onDragEnd: () => void;
  draggedTileIdRef: MutableRefObject<string | null>;
  validWordCells: Set<string>;
  dropTarget: { x: number; y: number } | null;
}

export default function Grid({
  state,
  onTileDrop,
  onReturnTileToRack,
  onDragStart,
  onDragMove,
  onDragEnd,
  draggedTileIdRef,
  validWordCells,
  dropTarget,
}: Props) {
  const grid: GridType = state.grid;

  const handleTilePointerDown = (
    e: React.PointerEvent,
    tileId: string,
    value: string,
    cellX: number,
    cellY: number
  ) => {
    e.stopPropagation();
    draggedTileIdRef.current = tileId;
    onDragStart(tileId, value, e.clientX, e.clientY);

    const moveHandler = (ev: PointerEvent) => onDragMove(ev.clientX, ev.clientY);
    const upHandler = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', moveHandler);
      window.removeEventListener('pointerup', upHandler);
      const tid = draggedTileIdRef.current;
      draggedTileIdRef.current = null;
      onDragEnd();
      if (!tid) return;
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const cellEl = el?.closest('[data-drop-cell]');
      if (cellEl) {
        const attr = cellEl.getAttribute('data-drop-cell');
        if (attr) {
          const [xs, ys] = attr.split(',');
          const dropX = parseInt(xs, 10);
          const dropY = parseInt(ys, 10);
          if (!Number.isNaN(dropX) && !Number.isNaN(dropY) && (dropX !== cellX || dropY !== cellY)) {
            onTileDrop(tid, dropX, dropY);
            return;
          }
        }
      }
      onReturnTileToRack(tid);
    };

    window.addEventListener('pointermove', moveHandler);
    window.addEventListener('pointerup', upHandler);
  };

  return (
    <div className="grid-wrap" data-name="Grid">
      {grid.map((row, y) =>
        row.map((cell, x) => {
          const tile = state.tiles.find((t) => t.id === cell.tileId) ?? null;
          const key = `${x}-${y}`;
          const inValidWord = validWordCells.has(key);
          const isDropTarget = dropTarget?.x === x && dropTarget?.y === y;

          return (
            <div
              key={key}
              data-drop-cell={`${x},${y}`}
              className={'grid-cell' + (isDropTarget ? ' grid-cell-drop-target' : '')}
            >
              {tile ? (
                <div
                  role="button"
                  tabIndex={0}
                  className={'grid-tile' + (inValidWord ? ' valid-word' : '')}
                  onPointerDown={(e) => handleTilePointerDown(e, tile.id, tile.value, x, y)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
                  }}
                >
                  {tile.value.toUpperCase()}
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}
