import { StyleSheet, Text, View } from 'react-native';

import { Palette, Spacing, TypeStyles } from '@/constants/theme';

type Props = {
  /** Left slot — typically a blue back link. */
  left?: React.ReactNode;
  /** Center title in body-strong. */
  title?: string;
  /** Right slot — balances layout when absent. */
  right?: React.ReactNode;
};

/**
 * Slim screen header in the sub-nav spirit: quiet 17px center title,
 * blue text actions on the flanks, hairline below.
 */
export function ScreenHeader({ left, title, right }: Props) {
  return (
    <View style={styles.bar}>
      <View style={styles.slot}>{left}</View>
      <Text style={[TypeStyles.bodyStrong, styles.title]} numberOfLines={1}>
        {title ?? ''}
      </Text>
      <View style={[styles.slot, styles.right]}>{right}</View>
    </View>
  );
}

const LINK = { color: Palette.primary, fontSize: 17, fontWeight: '400' } as const;

export const HeaderLinkStyle = StyleSheet.create({
  link: { ...LINK, letterSpacing: -0.37 },
});

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Palette.hairline,
    backgroundColor: Palette.canvas,
  },
  slot: { flex: 1 },
  right: { alignItems: 'flex-end' },
  title: { color: Palette.ink, flex: 2, textAlign: 'center' },
});
