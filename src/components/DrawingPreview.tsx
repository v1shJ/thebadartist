import { useMemo } from 'react';
import Svg, { Path } from 'react-native-svg';

import { frameStrokeWidth, frameViewBox, viewBoxString } from '@/drawing/bbox';
import { pointsToSmoothPath } from '@/drawing/paths';
import type { Drawing } from '@/types/drawing';

type Props = {
  drawing: Drawing;
  ink?: string;
};

/**
 * Static vector thumbnail — renders stored stroke data, never a
 * screenshot. Cropped to the artwork's bounding box so the drawing
 * fills the frame instead of floating in empty canvas.
 */
export function DrawingPreview({ drawing, ink = '#171717' }: Props) {
  const { vb, paths, strokeWidth } = useMemo(() => {
    const box = frameViewBox(drawing);
    return {
      vb: viewBoxString(box),
      paths: drawing.strokes.map((s) => ({
        id: s.id,
        d: pointsToSmoothPath(s.points),
      })),
      strokeWidth: frameStrokeWidth(drawing, box),
    };
  }, [drawing]);

  return (
    <Svg
      viewBox={vb}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      pointerEvents="none">
      {paths.map((p) => (
        <Path
          key={p.id}
          d={p.d}
          stroke={ink}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ))}
    </Svg>
  );
}
