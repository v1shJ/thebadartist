import type { Drawing } from '@/types/drawing';

export type ViewBox = { x: number; y: number; w: number; h: number };

/**
 * Content bounding box of a drawing, in capture units.
 * Used so thumbnails and replays frame the artwork instead of the
 * full (often mostly-empty) canvas.
 */
export function contentBBox(drawing: Drawing, padRatio = 0.12): ViewBox | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let found = false;

  for (const s of drawing.strokes) {
    for (const p of s.points) {
      found = true;
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }

  if (!found) return null;

  const pad = Math.max(maxX - minX, maxY - minY) * padRatio + 4;
  return {
    x: Math.max(0, minX - pad),
    y: Math.max(0, minY - pad),
    w: Math.min(drawing.width, maxX - minX + pad * 2) || drawing.width,
    h: Math.min(drawing.height, maxY - minY + pad * 2) || drawing.height,
  };
}

/** ViewBox for framing: content bbox when possible, full canvas otherwise. */
export function frameViewBox(drawing: Drawing): ViewBox {
  return (
    contentBBox(drawing) ?? {
      x: 0,
      y: 0,
      w: Math.max(1, drawing.width),
      h: Math.max(1, drawing.height),
    }
  );
}

export function viewBoxString(vb: ViewBox): string {
  return `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;
}

/** Stroke width in viewBox units that reads like a ~4px pen on the original canvas. */
export function frameStrokeWidth(drawing: Drawing, vb: ViewBox): number {
  const canvasMax = Math.max(1, drawing.width, drawing.height);
  const frameMax = Math.max(1, vb.w, vb.h);
  // Preserve the on-canvas pen ratio regardless of how tight the crop is.
  return (4 / canvasMax) * frameMax;
}
