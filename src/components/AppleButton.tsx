import * as Haptics from 'expo-haptics';
import { isValidElement, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Palette, Radius } from '@/constants/theme';

export type AppleButtonVariant = 'primary' | 'ghost' | 'dark';

type Props = {
  children: React.ReactNode;
  variant?: AppleButtonVariant;
  onPress?: () => void;
  disabled?: boolean;
  haptics?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * DESIGN.md button grammar: blue pill CTAs, ghost pills, compact dark
 * utility rects. Press state is a scale(0.95) transform — the
 * system-wide micro-interaction. No shadows, ever.
 */
export function AppleButton({
  children,
  variant = 'primary',
  onPress,
  disabled = false,
  haptics = true,
  style,
  accessibilityLabel,
}: Props) {
  const [scale] = useState(() => new Animated.Value(1));

  const pressIn = () => {
    Animated.timing(scale, { toValue: 0.95, duration: 120, useNativeDriver: true }).start();
    if (haptics && !disabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const pressOut = () => {
    Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled || !onPress}
      accessibilityLabel={accessibilityLabel}
      style={style}>
      <Animated.View
        style={[styles.base, styles[variant], disabled && styles.disabled, { transform: [{ scale }] }]}>
        {isValidElement(children) ? (
          children
        ) : (
          <Text style={[styles.label, styles[`${variant}Label`]]}>{children}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingVertical: 11,
    paddingHorizontal: 22,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingVertical: 11,
    paddingHorizontal: 22,
  },
  dark: {
    backgroundColor: Palette.ink,
    borderRadius: Radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.37,
  },
  primaryLabel: { color: Palette.onDark },
  ghostLabel: { color: Palette.primary },
  darkLabel: { color: Palette.onDark, fontSize: 14, letterSpacing: -0.22 },
});
