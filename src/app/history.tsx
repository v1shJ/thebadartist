import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppleButton } from '@/components/AppleButton';
import { GalleryCell, useGalleryMetrics } from '@/components/GalleryCell';
import { HeaderLinkStyle, ScreenHeader } from '@/components/ScreenHeader';
import { Palette, Spacing, TypeStyles } from '@/constants/theme';
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
  const { tileW } = useGalleryMetrics();

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
      <ScreenHeader
        title={`Gallery${drawings.length > 0 ? ` · ${drawings.length}` : ''}`}
        left={
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
            <Text style={HeaderLinkStyle.link}>‹ Back</Text>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {sections.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[TypeStyles.title, styles.emptyTitle]}>No drawings yet.</Text>
            <Text style={[TypeStyles.body, styles.emptyText]}>
              Every masterpiece starts with a bad first sketch.
            </Text>
            <Link href="/pick" asChild>
              <AppleButton accessibilityLabel="Draw your first">Draw your first</AppleButton>
            </Link>
          </View>
        ) : (
          sections.map(([label, items]) => (
            <View key={label} style={styles.section}>
              <Text style={[TypeStyles.captionStrong, styles.sectionTitle]}>{label}</Text>
              <View style={styles.grid}>
                {items.map((d) => (
                  <Link
                    key={d.id}
                    href={{ pathname: '/drawing/[id]', params: { id: d.id } }}
                    asChild>
                    <Pressable style={({ pressed }) => [{ width: tileW }, pressed && styles.pressed]}>
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
  safe: { flex: 1, backgroundColor: Palette.canvas },
  container: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.xl },
  section: { gap: Spacing.sm },
  sectionTitle: { color: Palette.secondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  pressed: { opacity: 0.6 },
  empty: { paddingTop: Spacing.xxl, gap: Spacing.sm, alignItems: 'flex-start' },
  emptyTitle: { color: Palette.ink },
  emptyText: { color: Palette.secondary, marginBottom: Spacing.md },
});
