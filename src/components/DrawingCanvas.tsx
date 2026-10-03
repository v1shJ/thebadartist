import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { pointsToSmoothPath } from '@/drawing/paths';
import type { Stroke } from '@/types/drawing';

type Props = {
  strokes: Stroke[];
  /** Pre-smoothed SVG path of the in-progress stroke, or null. */
  activeD: string | null;
  ink?: string;
  strokeWidth?: number;
  onBegin: (x: number, y: number) => void;
  onMove: (x: number, y: number) => void;
  onEnd: () => void;
  onCancel?: () => void;
  onCanvasLayout?: (width: number, height: number) => void;
};

/**
 * Touch canvas. Coordinates come from `locationX/locationY`, which are
 * already relative to this view — exactly the canvas-relative system
 * the data model requires.
 */
export function DrawingCanvas({
  strokes,
  activeD,
  ink = '#171717',
  strokeWidth = 4,
  onBegin,
  onMove,
  onEnd,
  onCancel,
  onCanvasLayout,
}: Props) {
  const committed = useMemo(
    () =>
      strokes.map((s) => ({
        id: s.id,
        d: pointsToSmoothPath(s.points),
      })),
    [strokes],
  );

  return (
    <View
      style={styles.canvas}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        onBegin(e.nativeEvent.locationX, e.nativeEvent.locationY);
      }}
      onResponderMove={(e) => {
        onMove(e.nativeEvent.locationX, e.nativeEvent.locationY);
      }}
      onResponderRelease={onEnd}
      onResponderTerminate={onCancel ?? onEnd}
      onLayout={(e) => {
        onCanvasLayout?.(e.nativeEvent.layout.width, e.nativeEvent.layout.height);
      }}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        {committed.map((p) => (
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
        {activeD != null && activeD !== '' && (
          <Path
            d={activeD}
            stroke={ink}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: '#F7F6F2',
  },
});
