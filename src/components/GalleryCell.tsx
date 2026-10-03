import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { DrawingPreview } from '@/components/DrawingPreview';
import { Palette, Spacing } from '@/constants/theme';
import type { Drawing } from '@/types/drawing';

function displayPrompt(drawing: Drawing): string {
  if (!drawing.prompt) return 'Free sketch';
  return drawing.prompt.charAt(0).toUpperCase() + drawing.prompt.slice(1);
}

/**
 * Grid metrics shared by every gallery (home + history grids both use
 * paddingHorizontal lg with a md gap). Token-driven so the explicit
 * pixel sizes always match the layout — screens use `tileW` for the
 * wrapper, the cell uses `artPx` for the artwork.
 */
export function useGalleryMetrics() {
  const windowWidth = useWindowDimensions().width;
  const tileW = Math.floor((windowWidth - Spacing.lg * 2 - Spacing.md) / 2);
  // Card border (2px × 2 sides); the artwork is otherwise full-bleed.
  const artPx = Math.max(1, tileW - 4);
  return { tileW, artPx };
}

/**
 * Gallery tile: zoom-capped artwork over a caption bar naming the
 * prompt. The visual half of a Link+Pressable wrapper in each screen.
 */
export function GalleryCell({ drawing }: { drawing: Drawing }) {
  const { artPx } = useGalleryMetrics();
  return (
    <View style={styles.cell}>
      <View style={[styles.preview, { width: artPx, height: artPx }]}>
        <DrawingPreview drawing={drawing} size={artPx} />
      </View>
      <View style={styles.caption}>
        <Text style={styles.prompt} numberOfLines={1}>
          {displayPrompt(drawing)}
        </Text>
        <Text style={styles.sub}>
          {drawing.strokes.length} stroke{drawing.strokes.length === 1 ? '' : 's'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    backgroundColor: Palette.card,
    borderWidth: 2,
    borderColor: Palette.ink,
    borderRadius: 14,
    overflow: 'hidden',
  },
  preview: {
    backgroundColor: Palette.paper,
  },
  caption: {
    borderTopWidth: 2,
    borderTopColor: Palette.ink,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: 1,
  },
  prompt: { fontSize: 14, fontWeight: '800', color: Palette.ink },
  sub: { fontSize: 12, color: Palette.secondary, fontWeight: '500' },
});
