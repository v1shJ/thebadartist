import { useMemo } from 'react';
import Svg, { Path } from 'react-native-svg';

import { frameStrokeWidth, frameViewBox, viewBoxString } from '@/drawing/bbox';
import { pointsToSmoothPath } from '@/drawing/paths';
import { Palette } from '@/constants/theme';
import type { Drawing } from '@/types/drawing';

type Props = {
  drawing: Drawing;
  ink?: string;
  /**
   * Explicit pixel size (square). Prefer this over percentage sizing:
   * percentage Svg dimensions inside aspect-ratio-derived parents do
   * not resolve reliably on native and render at viewBox-unit size.
   */
  size?: number;
};

/**
 * Static vector thumbnail — renders stored stroke data, never a
 * screenshot. Cropped to the artwork's bounding box so the drawing
 * fills the frame instead of floating in empty canvas.
 */
export function DrawingPreview({ drawing, ink = Palette.ink, size }: Props) {
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
