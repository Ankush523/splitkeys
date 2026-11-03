/** Split Keys — cinematic dark + brass glass (App Store tier). */

export type Tone = 'player' | 'gm';

export const playerTheme = {
  bg: '#050506',
  bgElevated: '#0a0a0c',
  bgCard: '#0f1115',
  line: 'rgba(255,255,255,0.10)',
  lineSoft: 'rgba(255,255,255,0.06)',
  glassTint: 'rgba(18, 16, 12, 0.55)',
  glassFill: 'rgba(255, 255, 255, 0.06)',
  glassStroke: 'rgba(255, 255, 255, 0.12)',
  glassHighlight: 'rgba(255, 255, 255, 0.20)',
  text: '#f4efe6',
  muted: '#a39e94',
  dim: '#6b655c',
  accent: '#d4af37',
  accentBright: '#f0cc55',
  accentSoft: 'rgba(212, 175, 55, 0.18)',
  accentGlow: 'rgba(212, 175, 55, 0.35)',
  accentInk: '#1a1508',
  danger: '#ff7b7b',
  success: '#6bc49a',
  scrim: 'rgba(0, 0, 0, 0.55)',
};

export const gmTheme = {
  bg: '#040608',
  bgElevated: '#0a0e14',
  bgCard: '#0d121a',
  line: 'rgba(255,255,255,0.10)',
  lineSoft: 'rgba(255,255,255,0.06)',
  glassTint: 'rgba(10, 14, 20, 0.58)',
  glassFill: 'rgba(255, 255, 255, 0.05)',
  glassStroke: 'rgba(255, 255, 255, 0.11)',
  glassHighlight: 'rgba(255, 255, 255, 0.18)',
  text: '#f0f3f8',
  muted: '#939eb0',
  dim: '#5c677a',
  accent: '#d4af37',
  accentBright: '#f0cc55',
  accentSoft: 'rgba(212, 175, 55, 0.14)',
  accentGlow: 'rgba(212, 175, 55, 0.32)',
  accentInk: '#1a1508',
  danger: '#ff8080',
  success: '#6bc49a',
  scrim: 'rgba(0, 0, 0, 0.55)',
};

export const F = {
  regular: 'Geist-Regular',
  medium: 'Geist-Medium',
  semibold: 'Geist-SemiBold',
  mono: 'GeistMono-Medium',
};

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const radius = { sm: 12, md: 16, lg: 20, xl: 24, pill: 999 } as const;

export const motion = {
  pressScale: 0.97,
  durationMs: 180,
};

export const type = {
  display: { fontFamily: F.semibold, fontSize: 34, lineHeight: 40, letterSpacing: -1 },
  title: { fontFamily: F.semibold, fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
  headline: { fontFamily: F.semibold, fontSize: 20, lineHeight: 26 },
  body: { fontFamily: F.regular, fontSize: 16, lineHeight: 25 },
  caption: { fontFamily: F.medium, fontSize: 13, lineHeight: 19 },
  overline: {
    fontFamily: F.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
  },
  mono: { fontFamily: F.mono, fontSize: 15, letterSpacing: 0.5 },
};

export function glassShadow(tone: Tone = 'player') {
  const c = themeOf(tone);
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: c.glassStroke,
  };
}

export function glowAccent(tone: Tone = 'player') {
  const c = themeOf(tone);
  return {
    shadowColor: c.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 6,
  };
}

export function themeOf(tone: Tone) {
  return tone === 'player' ? playerTheme : gmTheme;
}

/** @deprecated use glassShadow */
export function shadowCard(tone: Tone = 'player') {
  return glassShadow(tone);
}
