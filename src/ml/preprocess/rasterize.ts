import type { Stroke } from '../../types/drawing';

export const GRID_SIZE = 28;

export type RasterOptions = {
  size?: number;
  margin?: number;
  radius?: number;
  invert?: boolean;
};

type Pt = { x: number; y: number };

function stampDisc(img: Float32Array, size: number, x: number, y: number, radius: number) {
  const x0 = Math.max(0, Math.floor(x - radius - 1));
  const x1 = Math.min(size - 1, Math.ceil(x + radius + 1));
  const y0 = Math.max(0, Math.floor(y - radius - 1));
  const y1 = Math.min(size - 1, Math.ceil(y + radius + 1));
  for (let py = y0; py <= y1; py += 1) {
    for (let px = x0; px <= x1; px += 1) {
      const d = Math.hypot(px - x, py - y);
      const cov = radius + 0.5 - d;
      if (cov <= 0) continue;
      const i = py * size + px;
      const v = cov > 1 ? 1 : cov;
      if (v > img[i]) img[i] = v;
    }
  }
}

function stampSegment(
  img: Float32Array,
  size: number,
  a: Pt,
  b: Pt,
  radius: number,
) {
  const x0 = Math.max(0, Math.floor(Math.min(a.x, b.x) - radius - 1));
  const x1 = Math.min(size - 1, Math.ceil(Math.max(a.x, b.x) + radius + 1));
  const y0 = Math.max(0, Math.floor(Math.min(a.y, b.y) - radius - 1));
  const y1 = Math.min(size - 1, Math.ceil(Math.max(a.y, b.y) + radius + 1));
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const len2 = abx * abx + aby * aby;

  for (let py = y0; py <= y1; py += 1) {
    for (let px = x0; px <= x1; px += 1) {
      let t = 0;
      if (len2 > 0) {
        t = ((px - a.x) * abx + (py - a.y) * aby) / len2;
        if (t < 0) t = 0;
        else if (t > 1) t = 1;
      }
      const dx = px - (a.x + t * abx);
      const dy = py - (a.y + t * aby);
      const cov = radius + 0.5 - Math.hypot(dx, dy);
      if (cov <= 0) continue;
      const i = py * size + px;
      const v = cov > 1 ? 1 : cov;
      if (v > img[i]) img[i] = v;
    }
  }
}

/**
 * Renders raw strokes into a `size x size` ink grid in 0..1, matching the
 * Quick, Draw! bitmap conventions (bbox fit, aspect preserved, centered).
 */
export function rasterizeStrokes(
  strokes: Stroke[],
  options: RasterOptions = {},
): Float32Array {
  const size = options.size ?? GRID_SIZE;
  const margin = options.margin ?? 2;
  const radius = options.radius ?? 0.75;
  const invert = options.invert ?? false;

  const img = new Float32Array(size * size);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let count = 0;
  for (const stroke of strokes) {
    for (const p of stroke.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
      count += 1;
    }
  }

  if (count === 0) {
    if (invert) img.fill(1);
    return img;
  }

  const span = Math.max(maxX - minX, maxY - minY);
  const target = size - margin * 2;
  const scale = span > 1e-6 ? target / span : 0;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const center = (size - 1) / 2;

  for (const stroke of strokes) {
    const pts = stroke.points;
    if (pts.length === 0) continue;
    const mapped = pts.map((p) => ({
      x: scale === 0 ? center : (p.x - cx) * scale + center,
      y: scale === 0 ? center : (p.y - cy) * scale + center,
    }));
    if (mapped.length === 1) {
      stampDisc(img, size, mapped[0].x, mapped[0].y, radius);
      continue;
    }
    for (let i = 1; i < mapped.length; i += 1) {
      stampSegment(img, size, mapped[i - 1], mapped[i], radius);
    }
  }

  if (invert) {
    for (let i = 0; i < img.length; i += 1) img[i] = 1 - img[i];
  }
  return img;
}
