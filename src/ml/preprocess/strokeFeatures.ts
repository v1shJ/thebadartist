import type { Stroke } from '@/types/drawing';

export const STROKE_FEATURE_SIZE = 4;

export function strokeFeatures(strokes: Stroke[]): Float32Array {
  const rows: number[] = [];

  for (const stroke of strokes) {
    const points = stroke.points;
    if (points.length === 0) continue;

    rows.push(0, 0, 0, 1);
    for (let i = 1; i < points.length; i += 1) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const dt = Math.max(0, points[i].timestamp - points[i - 1].timestamp);
      rows.push(dx, dy, dt, 1);
    }
    rows.push(0, 0, 0, 0);
  }

  return new Float32Array(rows);
}
