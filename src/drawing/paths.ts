import type { Point } from '@/types/drawing';

/**
 * Convert raw points into a smooth SVG path string.
 *
 * Storage keeps every raw point; this function is render-only.
 * Uses Catmull-Rom → cubic Bézier conversion so polylines render
 * as a continuous curve instead of visible segments/dots.
 */
export function pointsToSmoothPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0];
    // Render a dot as a zero-length path with round linecap.
    return `M ${p.x} ${p.y} L ${p.x + 0.01} ${p.y + 0.01}`;
  }
  if (points.length === 2) {
    const [a, b] = points;
    return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/** Count total points across strokes — useful for perf diagnostics. */
export function countPoints(strokes: { points: Point[] }[]): number {
  let n = 0;
  for (const s of strokes) n += s.points.length;
  return n;
}
