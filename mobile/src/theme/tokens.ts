/** Split Keys — player room + GM control room (handoff palette, not generic SaaS). */
export const playerTheme = {
  bg: '#0c0e12',
  bgElevated: '#141820',
  line: '#252b36',
  text: '#eae6df',
  muted: '#8a857c',
  dim: '#5c574f',
  accent: '#c9a227',
  accentSoft: 'rgba(201, 162, 39, 0.14)',
  accentInk: '#1a1508',
  danger: '#d45c5c',
  success: '#5cb88a',
  vignette: 'rgba(0,0,0,0.35)',
};

export const gmTheme = {
  bg: '#151b24',
  bgElevated: '#1c2430',
  line: '#2a3444',
  text: '#e4e8ef',
  muted: '#8b95a8',
  dim: '#5a6478',
  accent: '#c9a227',
  accentSoft: 'rgba(201, 162, 39, 0.12)',
  accentInk: '#1a1508',
  danger: '#e07070',
  success: '#6bc49a',
};

import { Platform } from 'react-native';

/** System fonts at launch (Geist assets remain optional for a later design pass). */
export const F = {
  regular: Platform.select({ ios: 'System', default: 'sans-serif' }),
  medium: Platform.select({ ios: 'System', default: 'sans-serif-medium' }),
  semibold: Platform.select({ ios: 'System', default: 'sans-serif-medium' }),
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
};

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
