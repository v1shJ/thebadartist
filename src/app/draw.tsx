import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppleButton } from '@/components/AppleButton';
import { DrawingCanvas } from '@/components/DrawingCanvas';
import { HeaderLinkStyle } from '@/components/ScreenHeader';
import { Palette, Radius, Spacing, TypeStyles } from '@/constants/theme';
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
          <Text style={HeaderLinkStyle.link}>‹ Back</Text>
        </Pressable>
        <Pressable onPress={confirmClear} hitSlop={12} accessibilityLabel="Clear canvas">
          <Text style={HeaderLinkStyle.link}>Clear</Text>
        </Pressable>
      </View>

      <View style={styles.challenge}>
        <Text style={[TypeStyles.title, styles.title]}>{challengeTitle(prompt)}</Text>
        <Pressable onPress={swapPrompt} hitSlop={12} accessibilityLabel="Get a different prompt">
          <Text style={styles.swap}>New prompt</Text>
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

      <BlurView intensity={80} tint="light" style={styles.bar}>
        <AppleButton
          variant="ghost"
          onPress={engine.undo}
          disabled={!engine.canUndo}
          accessibilityLabel="Undo last stroke"
          style={styles.undo}>
          Undo
        </AppleButton>
        <AppleButton
          onPress={() => void finish()}
          disabled={engine.isEmpty || saving}
          accessibilityLabel="Finish drawing"
          style={styles.finish}>
          {saving
            ? 'Saving…'
            : engine.strokeCount === 0
              ? 'Finish'
              : `Finish · ${engine.strokeCount}`}
        </AppleButton>
      </BlurView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.parchment },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  challenge: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
    gap: 2,
  },
  title: { color: Palette.ink },
  swap: {
    color: Palette.primary,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.22,
  },
  stage: {
    flex: 1,
    marginHorizontal: Spacing.lg,
    backgroundColor: Palette.canvas,
    borderWidth: 1,
    borderColor: Palette.hairline,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Palette.hairline,
  },
  undo: { flex: 1 },
  finish: { flex: 2 },
});
