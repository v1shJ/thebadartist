import { StyleSheet, Text, View } from 'react-native';

import { DrawingPreview } from '@/components/DrawingPreview';
import { Palette, Spacing } from '@/constants/theme';
import type { Drawing } from '@/types/drawing';

function displayPrompt(drawing: Drawing): string {
  if (!drawing.prompt) return 'Free sketch';
  return drawing.prompt.charAt(0).toUpperCase() + drawing.prompt.slice(1);
}

/**
 * Gallery tile: bbox-cropped artwork over a caption bar naming the
 * prompt. The visual half of a Link+Pressable wrapper in each screen.
 */
export function GalleryCell({ drawing }: { drawing: Drawing }) {
  return (
    <View style={styles.cell}>
      <View style={styles.preview}>
        <DrawingPreview drawing={drawing} />
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
    aspectRatio: 1,
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
