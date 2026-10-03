import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { frameStrokeWidth, frameViewBox, viewBoxString } from '@/drawing/bbox';
import { pointsToSmoothPath } from '@/drawing/paths';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { Drawing } from '@/types/drawing';

type Props = {
  drawing: Drawing;
  ink?: string;
  autoPlay?: boolean;
  /** Dark tiles use white ink and sky-blue progress. */
  tone?: 'light' | 'dark';
  /** Explicit pixel size — same rationale as DrawingPreview's `size`. */
  size?: { width: number; height: number };
};

/**
 * Chronological replay of a drawing.
 *
 * Respects the recorded timestamps: each stroke appears after the
 * real pause that preceded it, and points within a stroke unfold over
 * the time they originally took. Remount (via key) to replay a
 * different drawing.
 */
export function ReplayCanvas({ drawing, ink, autoPlay = true, tone = 'light', size }: Props) {
  const stroke = ink ?? (tone === 'dark' ? Palette.onDark : Palette.ink);
  const trackActive = tone === 'dark' ? Palette.primaryOnDark : Palette.primary;
  const trackEmpty = tone === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.08)';
  const controlColor = tone === 'dark' ? Palette.onDark : Palette.primary;
  const timeline = useMemo(() => {
    const strokes = drawing.strokes;
    if (strokes.length === 0) return { total: 1, segments: [] as Segment[] };
    const start = strokes[0].startedAt;
    const end = Math.max(...strokes.map((s) => s.endedAt));
    const total = Math.max(1, end - start);
    const segments: Segment[] = strokes.map((s) => ({
      id: s.id,
      t0: (s.startedAt - start) / total,
      t1: (s.endedAt - start) / total,
      points: s.points,
    }));
    return { total, segments };
  }, [drawing]);

  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(autoPlay && drawing.strokes.length > 0);
  const progressRef = useRef(0);
  const lastTick = useRef(0);

  // Fixed replay length: real time, capped so long sessions stay watchable.
  const replayMs = Math.min(Math.max(timeline.total, 1200), 12000);

  useEffect(() => {
    if (!playing) return;
    lastTick.current = Date.now();
    let rafId = 0;
    const step = () => {
      const now = Date.now();
      const dt = (now - lastTick.current) / replayMs;
      lastTick.current = now;
      const next = Math.min(1, progressRef.current + dt);
      progressRef.current = next;
      setProgress(next);
      if (next >= 1) {
        setPlaying(false);
        return;
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [playing, replayMs]);

  const visible = useMemo(
    () =>
      timeline.segments
        .map((seg) => {
          if (progress < seg.t0) return null;
          const span = Math.max(1e-6, seg.t1 - seg.t0);
          const local = Math.min(1, (progress - seg.t0) / span);
          const count = Math.max(1, Math.ceil(seg.points.length * local));
          return { id: seg.id, d: pointsToSmoothPath(seg.points.slice(0, count)) };
        })
        .filter((x): x is { id: string; d: string } => x !== null),
    [timeline, progress],
  );

  const frame = useMemo(() => {
    const box = frameViewBox(drawing);
    return { vb: viewBoxString(box), strokeWidth: frameStrokeWidth(drawing, box) };
  }, [drawing]);

  const play = () => {
    if (progressRef.current >= 1) {
      progressRef.current = 0;
      setProgress(0);
    }
    setPlaying(true);
  };

  const restart = () => {
    progressRef.current = 0;
    setProgress(0);
    setPlaying(false);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.stage}>
        <Svg
          viewBox={frame.vb}
          width={size?.width ?? '100%'}
          height={size?.height ?? '100%'}
          preserveAspectRatio="xMidYMid meet">
          {visible.map((p) => (
            <Path
              key={p.id}
              d={p.d}
              stroke={stroke}
              strokeWidth={frame.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
        </Svg>
      </View>
      <View style={styles.controls}>
        <View style={styles.track}>
          <View style={[styles.fill, { flex: progress, backgroundColor: trackActive }]} />
          <View style={[styles.empty, { flex: Math.max(0, 1 - progress), backgroundColor: trackEmpty }]} />
        </View>
        <View style={styles.buttons}>
          <Pressable onPress={play} style={styles.btn} accessibilityLabel="Play replay">
            <Text style={[styles.btnText, { color: controlColor }]}>{progress >= 1 ? '↺ Replay' : playing ? '❚❚ Pause' : '▶ Play'}</Text>
          </Pressable>
          <Pressable onPress={restart} style={styles.btn} accessibilityLabel="Restart replay">
            <Text style={[styles.btnText, { color: controlColor }]}>Restart</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

type Segment = {
  id: string;
  t0: number;
  t1: number;
  points: Drawing['strokes'][number]['points'];
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  stage: { flex: 1 },
  controls: { paddingTop: Spacing.sm, gap: Spacing.xs },
  track: { flexDirection: 'row', height: 3, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: {},
  empty: {},
  buttons: { flexDirection: 'row', gap: Spacing.lg },
  btn: { paddingVertical: Spacing.xs, paddingHorizontal: 2 },
  btnText: { fontSize: 14, fontWeight: '400', letterSpacing: -0.22 },
});
