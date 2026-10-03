import { useCallback, useRef, useState } from 'react';

import { newId } from '@/drawing/ids';
import { pointsToSmoothPath } from '@/drawing/paths';
import type { Stroke } from '@/types/drawing';

const MIN_POINT_DISTANCE = 1.5;

export type CanvasSize = { width: number; height: number };

/**
 * Drawing engine — owns stroke capture, undo, clear.
 *
 * Raw points accumulate in a ref; only the rendered path string of
 * the in-progress stroke lives in state, so each touch event costs a
 * single <Path> update. All coordinates are canvas-relative.
 */
export function useDrawingEngine() {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [activeD, setActiveD] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });

  const activeStroke = useRef<Stroke | null>(null);
  const sessionStartedAt = useRef(0);

  const beginStroke = useCallback((x: number, y: number) => {
    const now = Date.now();
    if (sessionStartedAt.current === 0) sessionStartedAt.current = now;
    const stroke: Stroke = {
      id: newId('stroke'),
      points: [{ x, y, timestamp: now }],
      startedAt: now,
      endedAt: now,
    };
    activeStroke.current = stroke;
    setActiveD(pointsToSmoothPath(stroke.points));
  }, []);

  const appendPoint = useCallback((x: number, y: number) => {
    const s = activeStroke.current;
    if (!s) return;
    const now = Date.now();
    const last = s.points[s.points.length - 1];
    // Drop near-duplicate samples but keep the tail timestamp fresh.
    if (last && Math.hypot(x - last.x, y - last.y) < MIN_POINT_DISTANCE) {
      last.timestamp = now;
      s.endedAt = now;
      return;
    }
    s.points.push({ x, y, timestamp: now });
    s.endedAt = now;
    setActiveD(pointsToSmoothPath(s.points));
  }, []);

  const endStroke = useCallback(() => {
    const s = activeStroke.current;
    activeStroke.current = null;
    setActiveD(null);
    if (!s || s.points.length === 0) return;
    s.endedAt = Date.now();
    const finished: Stroke = { ...s, points: [...s.points] };
    setStrokes((prev) => [...prev, finished]);
  }, []);

  const cancelStroke = useCallback(() => {
    activeStroke.current = null;
    setActiveD(null);
  }, []);

  const undo = useCallback(() => {
    setStrokes((prev) => prev.slice(0, -1));
  }, []);

  const clear = useCallback(() => {
    activeStroke.current = null;
    sessionStartedAt.current = Date.now();
    setActiveD(null);
    setStrokes([]);
  }, []);

  const getSessionStartedAt = useCallback(() => sessionStartedAt.current, []);

  return {
    strokes,
    activeD,
    canvasSize,
    setCanvasSize,
    getSessionStartedAt,
    strokeCount: strokes.length,
    canUndo: strokes.length > 0,
    isEmpty: strokes.length === 0 && activeD === null,
    beginStroke,
    appendPoint,
    endStroke,
    cancelStroke,
    undo,
    clear,
  };
}

export type DrawingEngine = ReturnType<typeof useDrawingEngine>;
