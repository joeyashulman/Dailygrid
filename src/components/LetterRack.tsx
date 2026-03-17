import type { MutableRefObject } from 'react';
import type { GameState } from '../game/types';

interface Props {
  state: GameState;
  onTileDrop: (tileId: string, x: number, y: number) => void;
  onDragStart: (tileId: string, value: string, clientX: number, clientY: number) => void;
  onDragMove: (clientX: number, clientY: number) => void;
  onDragEnd: () => void;
  draggedTileIdRef: MutableRefObject<string | null>;
}


export default function LetterRack({
  state,
  onTileDrop,
  onDragStart,
  onDragMove,
  onDragEnd,
  draggedTileIdRef,
}: Props) {
  const handlePointerDown = (e: React.PointerEvent, tileId: string, value: string) => {
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
          const x = parseInt(xs, 10);
          const y = parseInt(ys, 10);
          if (!Number.isNaN(x) && !Number.isNaN(y)) {
            onTileDrop(tid, x, y);
          }
        }
      }
    };

    window.addEventListener('pointermove', moveHandler);
    window.addEventListener('pointerup', upHandler);
  };

  const rackSet = new Set(state.rackTileIds);
  const tiles = state.tiles;

  const renderSlot = (index: number) => {
    const tile = tiles[index];
    if (!tile || !rackSet.has(tile.id)) {
      return <div key={`empty-${index}`} className="rack-slot" aria-hidden />;
    }
    return (
      <div
        key={tile.id}
        role="button"
        tabIndex={0}
        onPointerDown={(e) => handlePointerDown(e, tile.id, tile.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
        }}
        className="rack-tile"
      >
        {tile.value.toUpperCase()}
      </div>
    );
  };

  return (
    <div className="rack" data-name="Rack">
      <div className="rack-row">
        {[0, 1, 2, 3, 4, 5].map(renderSlot)}
      </div>
      <div className="rack-row">
        {[6, 7, 8, 9, 10, 11].map(renderSlot)}
      </div>
    </div>
  );
}
