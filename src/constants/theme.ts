import { StyleSheet, type TextStyle } from 'react-native';

/**
 * Apple-design-analysis tokens (DESIGN.md).
 * Single accent: Action Blue. No decorative gradients, no chrome
 * shadows — elevation comes from surface change only.
 */
export const Palette = {
  primary: '#0066CC',
  primaryFocus: '#0071E3',
  primaryOnDark: '#2997FF',
  ink: '#1D1D1F',
  secondary: '#6E6E73',
  mutedLight: '#CCCCCC',
  hairline: 'rgba(0, 0, 0, 0.08)',
  canvas: '#FFFFFF',
  parchment: '#F5F5F7',
  pearl: '#FAFAFC',
  tileDark1: '#272729',
  tileDark2: '#2A2A2C',
  tileDark3: '#252527',
  black: '#000000',
  onDark: '#FFFFFF',
} as const;

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 17,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 80,
} as const;

export const Radius = {
  none: 0,
  xs: 5,
  sm: 8,
  md: 11,
  lg: 18,
  pill: 9999,
} as const;

/**
 * Type scale (DESIGN.md typography). Display = 600 weight with tight
 * tracking; body = 17/400; ladder is 300/400/600 only.
 */
export const Type = {
  hero: {
    fontSize: 56,
    fontWeight: '600',
    lineHeight: 60,
    letterSpacing: -0.3,
  } satisfies TextStyle,
  display: {
    fontSize: 40,
    fontWeight: '600',
    lineHeight: 44,
    letterSpacing: -0.2,
  } satisfies TextStyle,
  title: {
    fontSize: 34,
    fontWeight: '600',
    lineHeight: 40,
    letterSpacing: -0.37,
  } satisfies TextStyle,
  headline: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 32,
  } satisfies TextStyle,
  tagline: {
    fontSize: 21,
    fontWeight: '600',
    lineHeight: 25,
    letterSpacing: 0.2,
  } satisfies TextStyle,
  bodyStrong: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 21,
    letterSpacing: -0.37,
  } satisfies TextStyle,
  body: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 25,
    letterSpacing: -0.37,
  } satisfies TextStyle,
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.22,
  } satisfies TextStyle,
  captionStrong: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: -0.22,
  } satisfies TextStyle,
  footnote: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: -0.12,
  } satisfies TextStyle,
} as const;

export const TypeStyles = StyleSheet.create({
  hero: Type.hero,
  display: Type.display,
  title: Type.title,
  headline: Type.headline,
  tagline: Type.tagline,
  bodyStrong: Type.bodyStrong,
  body: Type.body,
  caption: Type.caption,
  captionStrong: Type.captionStrong,
  footnote: Type.footnote,
});
