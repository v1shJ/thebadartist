import { useMemo } from 'react';
import Svg, { Path } from 'react-native-svg';

import { pointsToSmoothPath } from '@/drawing/paths';
import type { Drawing } from '@/types/drawing';

type Props = {
  drawing: Drawing;
  ink?: string;
  strokeWidth?: number;
};

/**
 * Static vector thumbnail — renders stored stroke data, never a
 * screenshot. Scales via viewBox so any capture size fits any frame.
 */
export function DrawingPreview({ drawing, ink = '#171717', strokeWidth = 4 }: Props) {
  const paths = useMemo(
    () =>
      drawing.strokes.map((s) => ({
        id: s.id,
        d: pointsToSmoothPath(s.points),
      })),
    [drawing],
  );

  // Guard against zero-size drawings (defensive; shouldn't happen).
  const w = Math.max(1, drawing.width);
  const h = Math.max(1, drawing.height);

  // Stroke width is in capture units; scale it mildly so thumbnails
  // of large canvases don't render hairlines.
  const scaledWidth = strokeWidth * Math.max(w, h) * 0.006;

  return (
    <Svg
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: '100%', height: '100%' }}
      preserveAspectRatio="xMidYMid meet">
      {paths.map((p) => (
        <Path
          key={p.id}
          d={p.d}
          stroke={ink}
          strokeWidth={scaledWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ))}
    </Svg>
  );
}
