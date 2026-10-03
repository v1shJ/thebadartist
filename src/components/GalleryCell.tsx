import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { DrawingPreview } from '@/components/DrawingPreview';
import { Palette, Radius, Spacing, TypeStyles } from '@/constants/theme';
import type { Drawing } from '@/types/drawing';

function displayPrompt(drawing: Drawing): string {
  if (!drawing.prompt) return 'Free sketch';
  return drawing.prompt.charAt(0).toUpperCase() + drawing.prompt.slice(1);
}

/**
 * Grid metrics shared by every gallery (home + history grids both use
 * paddingHorizontal 24 with a 17px gap). Kept in one place so the
 * explicit pixel sizes below always match the layout.
 */
export function useGalleryMetrics() {
  const windowWidth = useWindowDimensions().width;
  const tileW = Math.floor((windowWidth - Spacing.lg * 2 - Spacing.md) / 2);
  // Card border (1px × 2) + card padding (12px × 2).
  const artPx = Math.max(1, tileW - 2 - Spacing.sm * 2);
  return { tileW, artPx };
}

/**
 * Store-utility-card grammar: white, 1px hairline, 18px radius,
 * square artwork with 8px inner radius, strong name + quiet caption.
 * Artwork renders at explicit pixel size and a zoom-capped frame so
 * every tile shows the whole drawing at true scale.
 */
export function GalleryCell({ drawing }: { drawing: Drawing }) {
  const { artPx } = useGalleryMetrics();
  return (
    <View style={styles.card}>
      <View style={[styles.art, { width: artPx, height: artPx }]}>
        <DrawingPreview drawing={drawing} size={artPx} />
      </View>
      <Text style={[TypeStyles.bodyStrong, styles.name]} numberOfLines={1}>
        {displayPrompt(drawing)}
      </Text>
      <Text style={[TypeStyles.caption, styles.sub]}>
        {drawing.strokes.length} stroke{drawing.strokes.length === 1 ? '' : 's'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.canvas,
    borderWidth: 1,
    borderColor: Palette.hairline,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: 2,
  },
  art: {
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Palette.parchment,
    marginBottom: Spacing.xs,
  },
  name: { color: Palette.ink },
  sub: { color: Palette.secondary },
});
