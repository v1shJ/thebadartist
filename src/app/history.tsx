import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GalleryCell } from '@/components/GalleryCell';
import { GameButton } from '@/components/GameButton';
import { Palette, Spacing } from '@/constants/theme';
import { drawingRepository } from '@/storage/drawingRepository';
import type { Drawing } from '@/types/drawing';

function dayLabel(createdAt: number): string {
  const d = new Date(createdAt);
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

export default function HistoryScreen() {
  const [drawings, setDrawings] = useState<Drawing[]>([]);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      const load = async () => {
        const all = await drawingRepository.getDrawings();
        if (live) setDrawings(all);
      };
      void load();
      return () => {
        live = false;
      };
    }, []),
  );

  const sections = useMemo(() => {
    const map = new Map<string, Drawing[]>();
    for (const d of drawings) {
      const label = dayLabel(d.createdAt);
      const list = map.get(label) ?? [];
      list.push(d);
      map.set(label, list);
    }
    return [...map.entries()];
  }, [drawings]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
          <Text style={styles.nav}>←</Text>
        </Pressable>
        <Text style={styles.title}>
          Gallery{drawings.length > 0 ? ` · ${drawings.length}` : ''}
        </Text>
        <View style={styles.spacer} />
      </View>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {sections.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No disasters yet.</Text>
            <Text style={styles.emptyText}>Every masterpiece starts with a bad first sketch.</Text>
            <Link href="/pick" asChild>
              <GameButton variant="accent" accessibilityLabel="Draw your first">
                Draw your first →
              </GameButton>
            </Link>
          </View>
        ) : (
          sections.map(([label, items]) => (
            <View key={label} style={styles.section}>
              <Text style={styles.sectionTitle}>{label}</Text>
              <View style={styles.grid}>
                {items.map((d) => (
                  <Link
                    key={d.id}
                    href={{ pathname: '/drawing/[id]', params: { id: d.id } }}
                    asChild>
                    <Pressable style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
                      <GalleryCell drawing={d} />
                    </Pressable>
                  </Link>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
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
  nav: { fontSize: 20, fontWeight: '800', color: Palette.ink, minWidth: 56 },
  spacer: { minWidth: 56 },
  title: { fontSize: 17, fontWeight: '800', color: Palette.ink },
  container: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.xl },
  section: { gap: Spacing.md },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: Palette.accent,
    fontWeight: '800',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  tile: { width: '47%', borderRadius: 14 },
  pressed: { opacity: 0.75 },
  empty: { paddingTop: Spacing.xxl, gap: Spacing.md },
  emptyTitle: { fontSize: 28, fontWeight: '900', color: Palette.ink },
  emptyText: { fontSize: 16, color: Palette.secondary },
});
