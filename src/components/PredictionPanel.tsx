import { StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';
import type { PredictionStatus } from '@/hooks/usePredictions';
import type { Prediction } from '@/types/drawing';

type Props = {
  status: PredictionStatus;
  predictions: Prediction[];
  prompt: string;
};

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function barWidth(confidence: number): DimensionValue {
  const percent = Math.max(2, Math.min(100, Math.round(confidence * 100)));
  return `${percent}%`;
}

export function PredictionPanel({ status, predictions, prompt }: Props) {
  const top = predictions.slice(0, 3);
  const failed = status === 'error';

  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <View style={styles.header}>
        <Text style={styles.kicker}>The AI sees</Text>
        {status === 'loading' ? <Text style={styles.hint}>reading…</Text> : null}
        {failed ? <Text style={styles.hint}>offline</Text> : null}
      </View>

      {top.length === 0 ? (
        <Text style={styles.empty}>
          {failed ? "Can't read this one yet." : 'Start drawing and it will guess.'}
        </Text>
      ) : (
        top.map((prediction, index) => {
          const isTarget = prediction.label === prompt;
          return (
            <View key={prediction.label} style={styles.row}>
              <Text style={styles.rank}>{index + 1}</Text>
              <View style={styles.body}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, isTarget && styles.labelTarget]} numberOfLines={1}>
                    {capitalize(prediction.label)}
                  </Text>
                  <Text style={styles.value}>{Math.round(prediction.confidence * 100)}%</Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      { width: barWidth(prediction.confidence) },
                      isTarget && styles.fillTarget,
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Palette.card,
    borderWidth: 1.5,
    borderColor: Palette.line,
    borderRadius: 14,
    gap: 6,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: {
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: Palette.accent,
    fontWeight: '800',
  },
  hint: { fontSize: 12, color: Palette.secondary },
  empty: { fontSize: 13, color: Palette.secondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rank: { width: 14, fontSize: 12, color: Palette.secondary, textAlign: 'center' },
  body: { flex: 1, gap: 3 },
  labelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  label: { flexShrink: 1, fontSize: 15, fontWeight: '700', color: Palette.ink },
  labelTarget: { color: Palette.accent },
  value: { fontSize: 12, color: Palette.secondary },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.paper,
    overflow: 'hidden',
  },
  fill: { height: 4, borderRadius: 2, backgroundColor: Palette.ink },
  fillTarget: { backgroundColor: Palette.accent },
});
