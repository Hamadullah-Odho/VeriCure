import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from 'react';

import {
  darkColors,
  lightColors,
  ThemeColors,
} from './colors';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({
  children,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  const isDark = theme === 'dark';

  const colors = isDark
    ? darkColors
    : lightColors;

  const toggleTheme = () => {
    setThemeState((currentTheme) =>
      currentTheme === 'dark' ? 'light' : 'dark'
    );
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors,
        toggleTheme,
        setTheme,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used inside ThemeProvider'
    );
  }

  return context;
}