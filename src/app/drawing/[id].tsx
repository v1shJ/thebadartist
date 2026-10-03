import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReplayCanvas } from '@/components/ReplayCanvas';
import { Palette, Spacing } from '@/constants/theme';
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
  return `A ${drawing.prompt.charAt(0).toUpperCase() + drawing.prompt.slice(1)}`;
}

const REPLAY_MAX_HEIGHT = 560;

export default function DrawingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [drawing, setDrawing] = useState<Drawing | null>(null);
  const [missing, setMissing] = useState(false);

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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
          <Text style={styles.nav}>←</Text>
        </Pressable>
        <Text style={styles.date}>{drawing ? formatDate(drawing.createdAt) : ''}</Text>
        <Pressable onPress={remove} hitSlop={12} accessibilityLabel="Delete drawing">
          <Text style={[styles.nav, styles.delete]}>Delete</Text>
        </Pressable>
      </View>

      {missing ? (
        <View style={styles.center}>
          <Text style={styles.muted}>This drawing no longer exists.</Text>
        </View>
      ) : !drawing ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.titleBlock}>
            <Text style={styles.kicker}>You drew</Text>
            <Text style={styles.title}>{displayPrompt(drawing)}</Text>
          </View>
          <View
            style={[
              styles.stage,
              {
                aspectRatio: Math.max(1, drawing.width) / Math.max(1, drawing.height),
              },
            ]}>
            <ReplayCanvas key={drawing.id} drawing={drawing} />
          </View>
          <View style={styles.meta}>
            <Meta label="Strokes" value={String(drawing.strokes.length)} />
            <Meta label="Points" value={String(pointCount)} />
            <Meta label="Time" value={formatDuration(drawing.durationMs)} />
            <Meta label="Canvas" value={`${drawing.width}×${drawing.height}`} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaValue}>{value}</Text>
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  nav: { fontSize: 17, fontWeight: '700', color: Palette.ink, minWidth: 64 },
  delete: { color: Palette.accent, textAlign: 'right' },
  date: { fontSize: 14, fontWeight: '600', color: Palette.secondary },
  container: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md },
  titleBlock: { gap: 2, paddingTop: Spacing.sm },
  kicker: {
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: Palette.accent,
    fontWeight: '800',
  },
  title: { fontSize: 32, fontWeight: '900', color: Palette.ink },
  stage: {
    width: '100%',
    maxHeight: REPLAY_MAX_HEIGHT,
    borderWidth: 2,
    borderColor: Palette.ink,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: Palette.paper,
    padding: Spacing.md,
  },
  meta: { flexDirection: 'row', gap: Spacing.lg, paddingTop: Spacing.sm },
  metaItem: { gap: 2 },
  metaValue: { fontSize: 17, fontWeight: '800', color: Palette.ink },
  metaLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Palette.secondary,
    fontWeight: '700',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: Palette.secondary, fontSize: 15 },
});
