import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GalleryCell } from '@/components/GalleryCell';
import { GameButton } from '@/components/GameButton';
import { Palette, Spacing } from '@/constants/theme';
import { drawingRepository } from '@/storage/drawingRepository';
import type { Drawing } from '@/types/drawing';

export default function HomeScreen() {
  const [recent, setRecent] = useState<Drawing[]>([]);
  const [total, setTotal] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      const load = async () => {
        const all = await drawingRepository.getDrawings();
        if (!live) return;
        setRecent(all.slice(0, 4));
        setTotal(all.length);
      };
      void load();
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

        <Link href="/pick" asChild>
          <GameButton variant="accent" accessibilityLabel="Start drawing">
            <View style={styles.startRow}>
              <Text style={styles.startText}>Start drawing</Text>
              <Text style={styles.startArrow}>→</Text>
            </View>
          </GameButton>
        </Link>

        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Fresh disasters</Text>
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
                <Pressable style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
                  <GalleryCell drawing={d} />
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
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: Palette.accent,
    fontWeight: '800',
  },
  title: { fontSize: 64, lineHeight: 60, fontWeight: '900', color: Palette.ink },
  tagline: { fontSize: 17, color: Palette.secondary, marginTop: Spacing.sm },
  startRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  startText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  startArrow: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: Palette.secondary,
    fontWeight: '800',
  },
  sectionLink: { fontSize: 14, color: Palette.ink, fontWeight: '700' },
  empty: {
    borderWidth: 2,
    borderColor: Palette.ink,
    borderRadius: 14,
    padding: Spacing.lg,
    backgroundColor: Palette.card,
  },
  emptyText: { color: Palette.secondary, fontSize: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  tile: { width: '47%', borderRadius: 14 },
  pressed: { opacity: 0.75 },
});
