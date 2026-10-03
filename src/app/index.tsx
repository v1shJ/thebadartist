import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppleButton } from '@/components/AppleButton';
import { GalleryCell, useGalleryMetrics } from '@/components/GalleryCell';
import { Palette, Spacing, TypeStyles } from '@/constants/theme';
import { drawingRepository } from '@/storage/drawingRepository';
import type { Drawing } from '@/types/drawing';

export default function HomeScreen() {
  const [recent, setRecent] = useState<Drawing[]>([]);
  const [total, setTotal] = useState(0);
  const { tileW } = useGalleryMetrics();

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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero tile */}
        <View style={styles.hero}>
          <Text style={[TypeStyles.display, styles.heroTitle]}>Bad Artist</Text>
          <Text style={[TypeStyles.tagline, styles.heroTag]}>
            Can I figure out what you&apos;re drawing?
          </Text>
          <View style={styles.ctas}>
            <Link href="/pick" asChild>
              <AppleButton accessibilityLabel="Start drawing">Start drawing</AppleButton>
            </Link>
            {total > 0 && (
              <Link href="/history" asChild>
                <AppleButton variant="ghost" accessibilityLabel="View gallery">
                  Gallery · {total}
                </AppleButton>
              </Link>
            )}
          </View>
        </View>

        {/* Gallery tile */}
        <View style={styles.gallery}>
          <Text style={[TypeStyles.headline, styles.galleryTitle]}>Fresh from the studio.</Text>
          {recent.length === 0 ? (
            <Text style={[TypeStyles.body, styles.muted]}>
              Nothing yet. Every masterpiece starts with a bad first sketch.
            </Text>
          ) : (
            <View style={styles.grid}>
              {recent.map((d) => (
                <Link key={d.id} href={{ pathname: '/drawing/[id]', params: { id: d.id } }} asChild>
                  <Pressable
                    style={({ pressed }) => [{ width: tileW }, pressed && styles.pressed]}>
                    <GalleryCell drawing={d} />
                  </Pressable>
                </Link>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.canvas },
  hero: {
    backgroundColor: Palette.canvas,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  heroTitle: { color: Palette.ink },
  heroTag: { color: Palette.secondary },
  ctas: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, flexWrap: 'wrap' },
  gallery: {
    backgroundColor: Palette.parchment,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  galleryTitle: { color: Palette.ink },
  muted: { color: Palette.secondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  pressed: { opacity: 0.6 },
});
