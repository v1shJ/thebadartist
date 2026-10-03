import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReplayCanvas } from '@/components/ReplayCanvas';
import { Palette, Spacing, TypeStyles } from '@/constants/theme';
import { drawingRepository } from '@/storage/drawingRepository';
import type { Drawing } from '@/types/drawing';

function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(createdAt: number): string {
  return new Date(createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function displayPrompt(drawing: Drawing): string {
  if (!drawing.prompt) return 'Free sketch';
  return drawing.prompt.charAt(0).toUpperCase() + drawing.prompt.slice(1);
}

export default function DrawingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [drawing, setDrawing] = useState<Drawing | null>(null);
  const [missing, setMissing] = useState(false);
  const windowWidth = useWindowDimensions().width;

  useEffect(() => {
    let live = true;
    const load = async () => {
      if (typeof id !== 'string') return;
      const found = await drawingRepository.getDrawing(id);
      if (!live) return;
      if (!found) setMissing(true);
      else setDrawing(found);
    };
    void load();
    return () => {
      live = false;
    };
  }, [id]);

  const remove = () => {
    if (!drawing) return;
    Alert.alert('Delete drawing?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await drawingRepository.deleteDrawing(drawing.id);
            router.replace('/history');
          })();
        },
      },
    ]);
  };

  const pointCount = drawing?.strokes.reduce((n, s) => n + s.points.length, 0) ?? 0;

  // Explicit stage size: the container is padded 24px on each side and
  // the replay keeps the canvas aspect, capped at 560px tall.
  const stageW = Math.max(1, windowWidth - Spacing.lg * 2);
  const stageH = drawing
    ? Math.min(stageW / (Math.max(1, drawing.width) / Math.max(1, drawing.height)), 560)
    : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {missing ? (
        <View style={styles.center}>
          <Text style={[TypeStyles.body, styles.muted]}>This drawing no longer exists.</Text>
        </View>
      ) : !drawing ? (
        <View style={styles.center}>
          <Text style={[TypeStyles.body, styles.muted]}>Loading…</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Dark exhibit tile */}
          <View style={styles.exhibit}>
            <View style={styles.exhibitBar}>
              <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
                <Text style={styles.backDark}>‹ Gallery</Text>
              </Pressable>
              <Pressable onPress={remove} hitSlop={12} accessibilityLabel="Delete drawing">
                <Text style={styles.deleteDark}>Delete</Text>
              </Pressable>
            </View>
            <Text style={[TypeStyles.caption, styles.exhibitKicker]}>
              {formatDate(drawing.createdAt)}
            </Text>
            <Text style={[TypeStyles.display, styles.exhibitTitle]}>
              {displayPrompt(drawing)}
            </Text>
            <View style={[styles.stage, { width: stageW, height: stageH }]}>
              <ReplayCanvas
                key={drawing.id}
                drawing={drawing}
                tone="dark"
                size={{ width: stageW, height: stageH }}
              />
            </View>
          </View>

          {/* Light spec tile */}
          <View style={styles.specs}>
            <Text style={[TypeStyles.headline, styles.specsTitle]}>How it happened.</Text>
            <View style={styles.meta}>
              <Meta label="Strokes" value={String(drawing.strokes.length)} />
              <Meta label="Points" value={String(pointCount)} />
              <Meta label="Time" value={formatDuration(drawing.durationMs)} />
              <Meta label="Canvas" value={`${drawing.width}×${drawing.height}`} />
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={[TypeStyles.bodyStrong, styles.metaValue]}>{value}</Text>
      <Text style={[TypeStyles.caption, styles.metaLabel]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.tileDark1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: Palette.mutedLight },
  exhibit: {
    backgroundColor: Palette.tileDark1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  exhibitBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  backDark: { color: Palette.primaryOnDark, fontSize: 17, fontWeight: '400', letterSpacing: -0.37 },
  deleteDark: { color: Palette.mutedLight, fontSize: 14, fontWeight: '400', letterSpacing: -0.22 },
  exhibitKicker: { color: Palette.mutedLight },
  exhibitTitle: { color: Palette.onDark, marginBottom: Spacing.md },
  stage: { maxHeight: 560 },
  specs: {
    backgroundColor: Palette.canvas,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  specsTitle: { color: Palette.ink },
  meta: { flexDirection: 'row', gap: Spacing.xl, flexWrap: 'wrap' },
  metaItem: { gap: 2, minWidth: 64 },
  metaValue: { color: Palette.ink },
  metaLabel: { color: Palette.secondary },
});
