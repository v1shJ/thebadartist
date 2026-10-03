import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DrawingCanvas } from '@/components/DrawingCanvas';
import { Palette, Spacing } from '@/constants/theme';
import { createDrawing } from '@/drawing/factory';
import { useDrawingEngine } from '@/hooks/useDrawingEngine';
import { drawingRepository } from '@/storage/drawingRepository';

export default function DrawScreen() {
  const engine = useDrawingEngine();
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    if (engine.isEmpty || saving) return;
    if (engine.canvasSize.width === 0) return;
    setSaving(true);
    try {
      const drawing = createDrawing({
        width: Math.round(engine.canvasSize.width),
        height: Math.round(engine.canvasSize.height),
        strokes: engine.strokes,
        sessionStartedAt: engine.getSessionStartedAt(),
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
          <Text style={styles.nav}>←</Text>
        </Pressable>
        <Text style={styles.hint}>
          {engine.strokeCount === 0 ? 'Draw something' : `${engine.strokeCount} stroke${engine.strokeCount === 1 ? '' : 's'}`}
        </Text>
        <Pressable onPress={confirmClear} hitSlop={12} accessibilityLabel="Clear canvas">
          <Text style={[styles.nav, styles.clear]}>Clear</Text>
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
        <Pressable
          onPress={engine.undo}
          disabled={!engine.canUndo}
          hitSlop={12}
          accessibilityLabel="Undo last stroke">
          <Text style={[styles.action, !engine.canUndo && styles.disabled]}>Undo</Text>
        </Pressable>
        <Pressable
          onPress={() => void finish()}
          disabled={engine.isEmpty || saving}
          style={({ pressed }) => [
            styles.finish,
            (engine.isEmpty || saving) && styles.finishDisabled,
            pressed && !(engine.isEmpty || saving) && styles.pressed,
          ]}
          accessibilityLabel="Finish drawing">
          <Text style={styles.finishText}>{saving ? 'Saving…' : 'Finish'}</Text>
        </Pressable>
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
    paddingVertical: Spacing.md,
  },
  nav: { fontSize: 17, fontWeight: '600', color: Palette.ink, minWidth: 56 },
  clear: { textAlign: 'right' },
  hint: { fontSize: 13, color: Palette.secondary, fontWeight: '500' },
  stage: {
    flex: 1,
    marginHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Palette.paper,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  action: { fontSize: 17, fontWeight: '600', color: Palette.ink, minWidth: 64 },
  disabled: { color: Palette.line },
  finish: {
    backgroundColor: Palette.accent,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  finishDisabled: { opacity: 0.35 },
  pressed: { opacity: 0.85 },
  finishText: { color: Palette.accentInk, fontSize: 17, fontWeight: '700' },
});
