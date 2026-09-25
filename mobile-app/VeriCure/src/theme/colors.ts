export const darkColors = {
  background: '#0A0A0A',
  card: '#171717',
  cardSecondary: '#262626',

  text: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#A3A3A3',
  textMuted: '#737373',

  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#A5B4FC',

  border: '#3F3F46',
  inputBackground: '#171717',

  iconBackground: '#1E1B4B',

  success: '#22C55E',
  successBackground: '#14532D',

  danger: '#EF4444',
  dangerBackground: '#7F1D1D',

  warning: '#F59E0B',
  warningBackground: '#78350F',

  overlay: 'rgba(0, 0, 0, 0.78)',

  white: '#FFFFFF',
  black: '#000000',
};

export const lightColors = {
  background: '#FAFAFA',
  card: '#FFFFFF',
  cardSecondary: '#F5F5F5',

  text: '#171717',
  textPrimary: '#171717',
  textSecondary: '#525252',
  textMuted: '#A3A3A3',

  primary: '#4F46E5',
  primaryDark: '#4338CA',
  primaryLight: '#3730A3',

  border: '#E5E5E5',
  inputBackground: '#FAFAFA',

  iconBackground: '#E0E7FF',

  success: '#16A34A',
  successBackground: '#DCFCE7',

  danger: '#DC2626',
  dangerBackground: '#FEE2E2',

  warning: '#D97706',
  warningBackground: '#FEF3C7',

  overlay: 'rgba(0, 0, 0, 0.5)',

  white: '#FFFFFF',
  black: '#000000',
};

export type ThemeColors =
  | typeof darkColors
  | typeof lightColors;
