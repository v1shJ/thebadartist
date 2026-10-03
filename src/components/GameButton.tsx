import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Palette } from '@/constants/theme';

export type GameButtonVariant = 'primary' | 'accent' | 'outline';

type Props = {
  children: React.ReactNode;
  variant?: GameButtonVariant;
  onPress?: () => void;
  disabled?: boolean;
  haptics?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const SHADOW_OFFSET = 4;

/**
 * Chunky game button: 2px ink border, hard offset shadow, springy
 * press that physically sinks into its shadow + a haptic tick.
 * String children render as a bold label; anything else renders as-is.
 */
export function GameButton({
  children,
  variant = 'primary',
  onPress,
  disabled = false,
  haptics = true,
  style,
  accessibilityLabel,
}: Props) {
  const [sink] = useState(() => new Animated.Value(0));

  const springTo = (toValue: number) => {
    Animated.spring(sink, {
      toValue,
      stiffness: 700,
      damping: 32,
      useNativeDriver: true,
    }).start();
  };

  const pressIn = () => {
    springTo(SHADOW_OFFSET);
    if (haptics && !disabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const pressOut = () => {
    springTo(0);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled || !onPress}
      accessibilityLabel={accessibilityLabel}
      style={[styles.pressArea, style]}>
      {/* Hard shadow */}
      <Animated.View
        style={[
          styles.shadow,
          disabled && styles.disabled,
          { transform: [{ translateY: SHADOW_OFFSET }] },
        ]}
      />
      <Animated.View
        style={[styles.face, styles[variant], disabled && styles.disabled, { transform: [{ translateY: sink }] }]}>
        {typeof children === 'string' ? (
          <Text style={[styles.label, labelColor[variant]]}>{children}</Text>
        ) : (
          children
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressArea: {
    paddingBottom: SHADOW_OFFSET,
  },
  face: {
    borderWidth: 2,
    borderColor: Palette.ink,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    position: 'absolute',
    top: SHADOW_OFFSET,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    backgroundColor: Palette.ink,
  },
  primary: {
    backgroundColor: Palette.ink,
    borderColor: Palette.ink,
  },
  accent: {
    backgroundColor: Palette.accent,
    borderColor: Palette.ink,
  },
  outline: {
    backgroundColor: Palette.paper,
    borderColor: Palette.ink,
  },
  disabled: {
    opacity: 0.35,
  },
  label: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

const labelColor = {
  primary: { color: Palette.paper },
  accent: { color: '#FFFFFF' },
  outline: { color: Palette.ink },
} as const;
