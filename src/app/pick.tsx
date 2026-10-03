import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameButton } from '@/components/GameButton';
import { Palette, Spacing } from '@/constants/theme';
import { pickThree, type PromptLabel } from '@/game/prompts';

export default function PickScreen() {
  const [trio, setTrio] = useState(pickThree);

  const choose = (prompt: PromptLabel) => {
    router.push({ pathname: '/draw', params: { prompt } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
            <Text style={styles.nav}>←</Text>
          </Pressable>
          <Pressable onPress={() => setTrio(pickThree())} hitSlop={12} accessibilityLabel="Shuffle options">
            <Text style={styles.nav}>↻ Shuffle</Text>
          </Pressable>
        </View>

        <View style={styles.masthead}>
          <Text style={styles.kicker}>Round one</Text>
          <Text style={styles.title}>Pick your{'\n'}disaster.</Text>
          <Text style={styles.sub}>Three options. One terrible drawing.</Text>
        </View>

        <View style={styles.options}>
          {trio.map((prompt, i) => (
            <GameButton
              key={prompt}
              variant="outline"
              onPress={() => choose(prompt)}
              accessibilityLabel={`Draw ${prompt}`}>
              <View style={styles.optionRow}>
                <Text style={styles.index}>0{i + 1}</Text>
                <Text style={styles.word}>{prompt}</Text>
                <Text style={styles.arrow}>→</Text>
              </View>
            </GameButton>
          ))}
        </View>

        <Text style={styles.foot}>I&apos;ll try to guess it while you draw. Eventually.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.paper },
  container: { flex: 1, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  nav: { fontSize: 16, fontWeight: '700', color: Palette.ink },
  masthead: { gap: Spacing.sm, paddingTop: Spacing.md },
  kicker: {
    fontSize: 12,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: Palette.accent,
    fontWeight: '800',
  },
  title: { fontSize: 44, lineHeight: 44, fontWeight: '900', color: Palette.ink },
  sub: { fontSize: 16, color: Palette.secondary },
  options: { gap: Spacing.sm, marginTop: Spacing.md },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
  },
  index: { fontSize: 13, fontWeight: '800', color: Palette.accent, minWidth: 24 },
  word: { fontSize: 26, fontWeight: '900', color: Palette.ink, flex: 1, textTransform: 'capitalize' },
  arrow: { fontSize: 22, fontWeight: '800', color: Palette.ink },
  foot: { fontSize: 13, color: Palette.secondary, marginTop: 'auto', textAlign: 'center' },
});
