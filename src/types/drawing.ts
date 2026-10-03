/**
 * Core drawing data model — Phase 1 source of truth.
 *
 * Rendering and storage are separate concerns built on top of this.
 * Raw stroke data is preserved verbatim for future ML work; derived
 * representations (normalized / simplified / rasterized) must be
 * computed from it, never replace it.
 */

export type Point = {
  /** X relative to the drawing canvas, in logical pixels. */
  x: number;
  /** Y relative to the drawing canvas, in logical pixels. */
  y: number;
  /** Unix epoch milliseconds (Date.now()). */
  timestamp: number;
};

export type Stroke = {
  id: string;
  points: Point[];
  startedAt: number;
  endedAt: number;
};

export type Drawing = {
  id: string;
  /** Canvas width in logical pixels at capture time. */
  width: number;
  /** Canvas height in logical pixels at capture time. */
  height: number;
  strokes: Stroke[];
  createdAt: number;
  /** Wall-clock ms from first touch to finish. */
  durationMs: number;
  /** Optional game prompt (Phase 2). Reserved now so the shape is stable. */
  prompt?: string;
};

/** Future ML seam — UI must not care where predictions come from. */
export type Prediction = {
  label: string;
  confidence: number;
};

export interface DrawingClassifier {
  predict(drawing: Drawing): Promise<Prediction[]>;
}
