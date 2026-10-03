import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeaderLinkStyle, ScreenHeader } from '@/components/ScreenHeader';
import { Palette, Radius, Spacing, TypeStyles } from '@/constants/theme';
import { pickThree, type PromptLabel } from '@/game/prompts';

export default function PickScreen() {
  const [trio, setTrio] = useState(pickThree);

  const choose = (prompt: PromptLabel) => {
    router.push({ pathname: '/draw', params: { prompt } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader
        title="Challenge"
        left={
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
            <Text style={HeaderLinkStyle.link}>‹ Back</Text>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[TypeStyles.title, styles.heading]}>Pick one.</Text>
        <Text style={[TypeStyles.body, styles.sub]}>
          Three options. One terrible drawing. I&apos;ll try to guess it — eventually.
        </Text>

        <View style={styles.options}>
          {trio.map((prompt) => (
            <Pressable
              key={prompt}
              onPress={() => choose(prompt)}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              accessibilityLabel={`Draw ${prompt}`}>
              <Text style={[TypeStyles.headline, styles.word]}>{prompt}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => setTrio(pickThree())} hitSlop={12} accessibilityLabel="Shuffle options">
          <Text style={styles.shuffle}>Shuffle</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.parchment },
  container: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  heading: { color: Palette.ink },
  sub: { color: Palette.secondary, marginBottom: Spacing.md },
  options: { gap: Spacing.sm },
  card: {
    backgroundColor: Palette.canvas,
    borderWidth: 1,
    borderColor: Palette.hairline,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: { opacity: 0.6 },
  word: { color: Palette.ink, textTransform: 'capitalize' },
  chevron: { fontSize: 28, fontWeight: '400', color: Palette.primary },
  shuffle: {
    color: Palette.primary,
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.37,
    textAlign: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});
