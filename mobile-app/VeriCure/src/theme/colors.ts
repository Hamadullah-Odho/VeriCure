export const darkColors = {
  background: '#06152F',
  card: '#0F2747',
  cardSecondary: '#0F172A',

  text: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  primary: '#06B6D4',
  primaryDark: '#0891B2',
  primaryLight: '#67E8F9',

  border: '#1E3A5F',
  inputBackground: '#0F2747',

  iconBackground: '#123A57',

  success: '#22C55E',
  successBackground: '#14532D',

  danger: '#EF4444',
  dangerBackground: '#7F1D1D',

  warning: '#F59E0B',
  warningBackground: '#78350F',

  overlay: 'rgba(2, 8, 23, 0.78)',

  white: '#FFFFFF',
  black: '#000000',
};

export const lightColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  cardSecondary: '#F1F5F9',

  text: '#0F172A',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  primary: '#06B6D4',
  primaryDark: '#0891B2',
  primaryLight: '#0E7490',

  border: '#E2E8F0',
  inputBackground: '#F8FAFC',

  iconBackground: '#E0F2FE',

  success: '#16A34A',
  successBackground: '#DCFCE7',

  danger: '#DC2626',
  dangerBackground: '#FEE2E2',

  warning: '#D97706',
  warningBackground: '#FEF3C7',

  overlay: 'rgba(15, 23, 42, 0.55)',

  white: '#FFFFFF',
  black: '#000000',
};

export type ThemeColors =
  | typeof darkColors
  | typeof lightColors;