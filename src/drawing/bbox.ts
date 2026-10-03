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
export function frameViewBox(drawing: Drawing, minFraction = 0.5): ViewBox {
  const fullW = Math.max(1, drawing.width);
  const fullH = Math.max(1, drawing.height);
  const box = contentBBox(drawing);
  if (!box) return { x: 0, y: 0, w: fullW, h: fullH };

  // Never zoom tighter than minFraction of the canvas's largest side —
  // a tiny doodle must stay recognizable, not fill the frame as a giant
  // cropped corner. Caps zoom at ~1/minFraction.
  const minDim = Math.max(fullW, fullH) * minFraction;
  let w = Math.max(box.w, minDim);
  let h = Math.max(box.h, minDim);
  if (w > fullW) w = fullW;
  if (h > fullH) h = fullH;

  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const x = Math.min(Math.max(0, cx - w / 2), Math.max(0, fullW - w));
  const y = Math.min(Math.max(0, cy - h / 2), Math.max(0, fullH - h));
  return { x, y, w, h };
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
