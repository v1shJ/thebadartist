import { useMemo } from 'react';
import Svg, { Path } from 'react-native-svg';

import { frameStrokeWidth, frameViewBox, viewBoxString } from '@/drawing/bbox';
import { pointsToSmoothPath } from '@/drawing/paths';
import type { Drawing } from '@/types/drawing';

type Props = {
  drawing: Drawing;
  ink?: string;
  /**
   * Explicit pixel size (square). Percentage Svg dimensions do not resolve
   * reliably against aspect-ratio-derived parents on native — the Svg can
   * fall back to viewBox-unit sizing and render enormously, showing only a
   * cropped top-left corner. Pass a measured size wherever one is known.
   */
  size?: number;
};

/**
 * Static vector thumbnail — renders stored stroke data, never a
 * screenshot. Framed on the artwork (zoom-capped) so the drawing fills
 * the tile without blowing up into an unrecognizable crop.
 */
export function DrawingPreview({ drawing, ink = '#171717', size }: Props) {
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
      width={size ?? '100%'}
      height={size ?? '100%'}
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
