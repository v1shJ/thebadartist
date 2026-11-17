import { StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { Palette, Radius, Spacing, TypeStyles } from '@/constants/theme';
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
        <Text style={[TypeStyles.captionStrong, styles.title]}>The AI thinks</Text>
        {status === 'loading' ? <Text style={styles.hint}>reading…</Text> : null}
        {failed ? <Text style={styles.hint}>offline</Text> : null}
      </View>

      {top.length === 0 ? (
        <Text style={[TypeStyles.caption, styles.empty]}>
          {failed ? "Can't read this one yet." : 'Start drawing and it will guess.'}
        </Text>
      ) : (
        top.map((prediction, index) => {
          const isTarget = prediction.label === prompt;
          return (
            <View key={prediction.label} style={styles.row}>
              <Text style={[TypeStyles.caption, styles.rank]}>{index + 1}</Text>
              <View style={styles.body}>
                <View style={styles.labelRow}>
                  <Text
                    style={[TypeStyles.captionStrong, styles.label, isTarget && styles.labelTarget]}
                    numberOfLines={1}>
                    {capitalize(prediction.label)}
                  </Text>
                  <Text style={[TypeStyles.footnote, styles.value]}>
                    {Math.round(prediction.confidence * 100)}%
                  </Text>
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
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Palette.canvas,
    borderWidth: 1,
    borderColor: Palette.hairline,
    borderRadius: Radius.lg,
    gap: 6,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: Palette.ink },
  hint: { ...TypeStyles.footnote, color: Palette.secondary },
  empty: { color: Palette.secondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  rank: { width: 12, color: Palette.mutedLight, textAlign: 'center' },
  body: { flex: 1, gap: 3 },
  labelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  label: { color: Palette.ink, flexShrink: 1 },
  labelTarget: { color: Palette.primary },
  value: { color: Palette.secondary },
  track: {
    height: 3,
    borderRadius: Radius.pill,
    backgroundColor: Palette.parchment,
    overflow: 'hidden',
  },
  fill: { height: 3, borderRadius: Radius.pill, backgroundColor: Palette.mutedLight },
  fillTarget: { backgroundColor: Palette.primary },
});
