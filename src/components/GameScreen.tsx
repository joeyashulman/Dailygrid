import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameState, Grid } from '../game/types';
import { generateRackForDate, getTodayDateKey } from '../game/rackGenerator';
import { checkWord, preloadDictionary } from '../game/dictionary';
import { computeLiveValidationAsync, type LiveValidation } from '../game/liveValidation';
import GridView from './Grid';
import LetterRack from './LetterRack';

const GRID_SIZE = 12;

function makeEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({ tileId: null }))
  );
}

function formatDisplayDate(dateKey: string): string {
  const [y, m, day] = dateKey.split('-').map(Number);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const suffix =
    day === 1 || day === 21 || day === 31
      ? 'st'
      : day === 2 || day === 22
        ? 'nd'
        : day === 3 || day === 23
          ? 'rd'
          : 'th';
  return `${months[m - 1]} ${day}${suffix}, ${y}`;
}

export default function GameScreen() {
  const [state, setState] = useState<GameState | null>(null);
  const [liveValidation, setLiveValidation] = useState<LiveValidation | null>(null);
  const [hasWon, setHasWon] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const validationRequestRef = useRef(0);
  const [dragPreview, setDragPreview] = useState<{ value: string; x: number; y: number } | null>(
    null
  );
  const [dropTarget, setDropTarget] = useState<{ x: number; y: number } | null>(null);
  const draggedTileIdRef = useRef<string | null>(null);
  const stateRef = useRef<GameState | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Preload dictionary so validation (blue valid words) works as soon as tiles are placed
  useEffect(() => {
    preloadDictionary();
  }, []);

  const handleDragStart = useCallback(
    (_tileId: string, value: string, clientX: number, clientY: number) => {
      if (hasWon) return;
      setDragPreview({ value, x: clientX, y: clientY });
    },
    [hasWon]
  );

  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (hasWon) return;
      setDragPreview((prev) => (prev ? { ...prev, x: clientX, y: clientY } : null));
      const el = document.elementFromPoint(clientX, clientY);
      const cellEl = el?.closest('[data-drop-cell]');
      if (cellEl) {
        const attr = cellEl.getAttribute('data-drop-cell');
        if (attr) {
          const [xs, ys] = attr.split(',');
          const x = parseInt(xs, 10);
          const y = parseInt(ys, 10);
          if (!Number.isNaN(x) && !Number.isNaN(y)) {
            setDropTarget({ x, y });
            return;
          }
        }
      }
      setDropTarget(null);
    },
    [hasWon]
  );

  const handleDragEnd = useCallback(() => {
    if (hasWon) return;
    setDragPreview(null);
    setDropTarget(null);
  }, [hasWon]);

  const handleTileDrop = useCallback((tileId: string, x: number, y: number) => {
    if (hasWon) return;
    const s = stateRef.current;
    if (!s) return;
    const grid = s.grid;
    const cell = grid[y]?.[x];
    if (!cell) return;
    if (cell.tileId === tileId) return;

    const tileIsInRack = s.rackTileIds.includes(tileId);
    let newGrid = grid.map((row) => row.map((c) => ({ ...c })));
    let newRack = [...s.rackTileIds];

    if (tileIsInRack) {
      newRack = s.rackTileIds.filter((id) => id !== tileId);
    } else {
      newGrid = newGrid.map((row) =>
        row.map((c) => (c.tileId === tileId ? { tileId: null } : c))
      );
    }

    const displacedTileId = cell.tileId;
    if (displacedTileId) {
      newRack = [...newRack, displacedTileId];
    }

    newGrid = newGrid.map((row, yy) =>
      row.map((c, xx) => (xx === x && yy === y ? { tileId } : c))
    );

    setState({ ...s, grid: newGrid, rackTileIds: newRack });
  }, [hasWon]);

  const handleReturnTileToRack = useCallback((tileId: string) => {
    if (hasWon) return;
    const s = stateRef.current;
    if (!s || s.rackTileIds.includes(tileId)) return;
    const newGrid = s.grid.map((row) =>
      row.map((c) => (c.tileId === tileId ? { tileId: null } : c))
    );
    setState({
      ...s,
      grid: newGrid,
      rackTileIds: [...s.rackTileIds, tileId],
    });
  }, [hasWon]);

  const handleRecallAll = useCallback(() => {
    if (hasWon) return;
    const s = stateRef.current;
    if (!s) return;
    const onRack = s.rackTileIds.length;
    if (onRack === 12) return;
    setState({
      ...s,
      grid: makeEmptyGrid(),
      rackTileIds: s.tiles.map((t) => t.id),
    });
  }, [hasWon]);

  useEffect(() => {
    const dateKey = getTodayDateKey();
    const tiles = generateRackForDate(dateKey);
    setState({
      dateKey,
      tiles,
      rackTileIds: tiles.map((t) => t.id),
      grid: makeEmptyGrid(),
    });
  }, []);

  useEffect(() => {
    if (!state) return;
    const req = ++validationRequestRef.current;
    computeLiveValidationAsync(state, checkWord)
      .then((result) => {
        if (req === validationRequestRef.current) {
          setLiveValidation(result);
        }
      })
      .catch((err) => {
        console.error('Word validation failed:', err);
        if (req === validationRequestRef.current) {
          setLiveValidation({
            invalidWordCells: new Set(),
            validWordCells: new Set(),
            hasShortWord: false,
            isConnected: false,
          });
        }
      });
  }, [state]);

  // Compute win condition: all tiles used, all words valid, single connected grid.
  useEffect(() => {
    if (!state || !liveValidation) return;
    const allTilesUsed = state.rackTileIds.length === 0;
    const noShort = !liveValidation.hasShortWord;
    const noInvalid = liveValidation.invalidWordCells.size === 0;
    const connected = liveValidation.isConnected;
    const win = allTilesUsed && noShort && noInvalid && connected;
    setHasWon(win);
    if (win && !showWinModal) {
      setShowWinModal(true);
    }
  }, [state, liveValidation, showWinModal]);

  if (!state) {
    return (
      <div className="loading">
        Generating today&apos;s puzzle…
      </div>
    );
  }

  const validWordCells = liveValidation?.validWordCells ?? new Set<string>();
  const recallDisabled = state.rackTileIds.length === 12 || hasWon;

  return (
    <div className="game-screen">
      <header>
        <div className="header-row">
          <h1
            style={{
              margin: 0,
              flexShrink: 0,
              fontWeight: 700,
              color: '#fff',
              whiteSpace: 'nowrap',
              fontFamily: 'SF Pro, system-ui, sans-serif',
              fontSize: 'var(--Header-font-size)',
              lineHeight: 'var(--Header-line-height)',
              letterSpacing: 'var(--Header-letter-spacing)',
            }}
          >
            Daily Grid
          </h1>
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 23,
              padding: '4px 8px',
              backgroundColor: 'var(--Backgrounds-Tertiary)',
              border: '1px solid var(--Backgrounds-Tertiary-Elevated)',
              fontFamily: 'SF Pro, system-ui, sans-serif',
              fontSize: 'var(--Helper-font-size)',
              lineHeight: 'var(--Helper-line-height)',
              letterSpacing: 'var(--Helper-letter-spacing)',
              fontWeight: 400,
              color: 'var(--Labels-Primary)',
            }}
          >
            {formatDisplayDate(state.dateKey)}
          </div>
        </div>
        <p
          style={{
            margin: 0,
            width: '100%',
            fontFamily: 'SF Pro, system-ui, sans-serif',
            fontSize: 'var(--Helper-font-size)',
            lineHeight: 'var(--Helper-line-height)',
            letterSpacing: 'var(--Helper-letter-spacing)',
            color: 'var(--Labels-Secondary)',
          }}
        >
          Use all 12 tiles to build a single connected crossword grid of valid words. Words must be
          at least 3 letters. Good luck!
        </p>
      </header>

      <GridView
        state={state}
        onTileDrop={handleTileDrop}
        onReturnTileToRack={handleReturnTileToRack}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        draggedTileIdRef={draggedTileIdRef}
        validWordCells={validWordCells}
        dropTarget={dropTarget}
      />

      <LetterRack
        state={state}
        onTileDrop={handleTileDrop}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        draggedTileIdRef={draggedTileIdRef}
      />

      <button
        type="button"
        onClick={handleRecallAll}
        disabled={recallDisabled}
        className="recall-btn"
      >
        Recall Tiles
      </button>

      {dragPreview && (
        <div className="drag-preview" aria-hidden>
          <div
            className="drag-preview-tile"
            style={{ left: dragPreview.x, top: dragPreview.y }}
          >
            {dragPreview.value.toUpperCase()}
          </div>
        </div>
      )}

      {showWinModal && (
        <div className="win-overlay" aria-modal="true" role="dialog">
          <div className="win-modal">
            <button
              type="button"
              className="win-modal-close"
              aria-label="Close"
              onClick={() => setShowWinModal(false)}
            >
              ×
            </button>
            <h2 className="win-modal-title">You Win!</h2>
            <button type="button" className="win-modal-share-btn">
              Share Your Grid
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

