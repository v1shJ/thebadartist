import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DrawingCanvas } from '@/components/DrawingCanvas';
import { GameButton } from '@/components/GameButton';
import { Palette, Spacing } from '@/constants/theme';
import { createDrawing } from '@/drawing/factory';
import { challengeTitle, isPromptLabel, pickReplacement, type PromptLabel } from '@/game/prompts';
import { useDrawingEngine } from '@/hooks/useDrawingEngine';
import { drawingRepository } from '@/storage/drawingRepository';

export default function DrawScreen() {
  const { prompt: rawPrompt } = useLocalSearchParams<{ prompt?: string }>();
  const initial: PromptLabel | null =
    typeof rawPrompt === 'string' && isPromptLabel(rawPrompt) ? rawPrompt : null;
  const [prompt, setPrompt] = useState<PromptLabel | null>(initial);

  const engine = useDrawingEngine();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial === null) router.replace('/pick');
  }, [initial]);

  const swapPrompt = () => {
    if (!prompt) return;
    const next = pickReplacement(prompt);
    if (engine.isEmpty) {
      setPrompt(next);
      return;
    }
    Alert.alert('Switch challenge?', `Your ${prompt} sketch will be cleared.`, [
      { text: 'Keep drawing', style: 'cancel' },
      {
        text: 'Switch',
        style: 'destructive',
        onPress: () => {
          engine.clear();
          setPrompt(next);
        },
      },
    ]);
  };

  const finish = async () => {
    if (engine.isEmpty || saving || !prompt) return;
    if (engine.canvasSize.width === 0) return;
    setSaving(true);
    try {
      const drawing = createDrawing({
        width: Math.round(engine.canvasSize.width),
        height: Math.round(engine.canvasSize.height),
        strokes: engine.strokes,
        sessionStartedAt: engine.getSessionStartedAt(),
        prompt,
      });
      await drawingRepository.save(drawing);
      router.replace({ pathname: '/drawing/[id]', params: { id: drawing.id } });
    } finally {
      setSaving(false);
    }
  };

  const confirmClear = () => {
    if (engine.isEmpty) return;
    Alert.alert('Clear canvas?', 'This removes every stroke.', [
      { text: 'Keep drawing', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: engine.clear },
    ]);
  };

  if (!prompt) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
          <Text style={styles.nav}>←</Text>
        </Pressable>
        <Pressable onPress={confirmClear} hitSlop={12} accessibilityLabel="Clear canvas">
          <Text style={[styles.nav, styles.clear]}>Clear</Text>
        </Pressable>
      </View>

      <View style={styles.challenge}>
        <View style={styles.challengeText}>
          <Text style={styles.kicker}>Your challenge</Text>
          <Text style={styles.title}>{challengeTitle(prompt)}</Text>
        </View>
        <Pressable onPress={swapPrompt} hitSlop={12} accessibilityLabel="Get a different prompt">
          <Text style={styles.swap}>↻ New</Text>
        </Pressable>
      </View>

      <View style={styles.stage}>
        <DrawingCanvas
          strokes={engine.strokes}
          activeD={engine.activeD}
          onBegin={engine.beginStroke}
          onMove={engine.appendPoint}
          onEnd={engine.endStroke}
          onCancel={engine.cancelStroke}
          onCanvasLayout={(w, h) => engine.setCanvasSize({ width: w, height: h })}
        />
      </View>

      <View style={styles.bottomBar}>
        <GameButton
          variant="outline"
          onPress={engine.undo}
          disabled={!engine.canUndo}
          accessibilityLabel="Undo last stroke"
          style={styles.undo}>
          Undo
        </GameButton>
        <GameButton
          variant="accent"
          onPress={() => void finish()}
          disabled={engine.isEmpty || saving}
          accessibilityLabel="Finish drawing"
          style={styles.finish}>
          {saving
            ? 'Saving…'
            : engine.strokeCount === 0
              ? 'Finish'
              : `Finish · ${engine.strokeCount} stroke${engine.strokeCount === 1 ? '' : 's'}`}
        </GameButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.paper },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  nav: { fontSize: 17, fontWeight: '700', color: Palette.ink, minWidth: 56 },
  clear: { textAlign: 'right' },
  challenge: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  challengeText: { flex: 1, gap: 2 },
  kicker: {
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: Palette.accent,
    fontWeight: '800',
  },
  title: { fontSize: 30, fontWeight: '900', color: Palette.ink },
  swap: { fontSize: 15, fontWeight: '700', color: Palette.ink, paddingBottom: 4 },
  stage: {
    flex: 1,
    marginHorizontal: Spacing.lg,
    borderWidth: 2,
    borderColor: Palette.ink,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: Palette.paper,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  undo: { flex: 1 },
  finish: { flex: 2 },
});
