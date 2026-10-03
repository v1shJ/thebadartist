import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DrawingPreview } from '@/components/DrawingPreview';
import { Palette, Spacing } from '@/constants/theme';
import { drawingRepository } from '@/storage/drawingRepository';
import type { Drawing } from '@/types/drawing';

export default function HomeScreen() {
  const [recent, setRecent] = useState<Drawing[]>([]);
  const [total, setTotal] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      void (async () => {
        const all = await drawingRepository.getDrawings();
        if (!live) return;
        setRecent(all.slice(0, 4));
        setTotal(all.length);
      })();
      return () => {
        live = false;
      };
    }, []),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.masthead}>
          <Text style={styles.kicker}>A drawing game</Text>
          <Text style={styles.title}>Bad{'\n'}Artist</Text>
          <Text style={styles.tagline}>Can I figure out what you&apos;re drawing?</Text>
        </View>

        <Link href="/draw" asChild>
          <Pressable style={({ pressed }) => [styles.start, pressed && styles.pressed]}>
            <Text style={styles.startText}>Start drawing</Text>
            <Text style={styles.startArrow}>→</Text>
          </Pressable>
        </Link>

        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent</Text>
          {total > 0 && (
            <Link href="/history" asChild>
              <Pressable>
                <Text style={styles.sectionLink}>
                  {total} drawing{total === 1 ? '' : 's'} →
                </Text>
              </Pressable>
            </Link>
          )}
        </View>

        {recent.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nothing yet. Make something terrible.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {recent.map((d) => (
              <Link key={d.id} href={{ pathname: '/drawing/[id]', params: { id: d.id } }} asChild>
                <Pressable style={({ pressed }) => [styles.cell, pressed && styles.pressed]}>
                  <DrawingPreview drawing={d} />
                </Pressable>
              </Link>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.paper },
  container: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.lg },
  masthead: { paddingTop: Spacing.xxl, gap: Spacing.sm },
  kicker: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Palette.secondary,
    fontWeight: '600',
  },
  title: {
    fontSize: 64,
    lineHeight: 60,
    fontWeight: '800',
    color: Palette.ink,
    fontFamily: 'System',
  },
  tagline: { fontSize: 17, color: Palette.secondary, marginTop: Spacing.sm },
  start: {
    backgroundColor: Palette.ink,
    borderRadius: 999,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  pressed: { opacity: 0.75 },
  startText: { color: Palette.paper, fontSize: 17, fontWeight: '700' },
  startArrow: { color: Palette.accent, fontSize: 20, fontWeight: '700' },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Palette.secondary,
    fontWeight: '600',
  },
  sectionLink: { fontSize: 14, color: Palette.ink, fontWeight: '600' },
  empty: {
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: 12,
    padding: Spacing.lg,
  },
  emptyText: { color: Palette.secondary, fontSize: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  cell: {
    width: '47%',
    aspectRatio: 3 / 4,
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 6,
  },
});
