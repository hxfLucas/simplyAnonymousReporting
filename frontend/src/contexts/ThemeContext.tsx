import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('themeMode');
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('themeMode', mode);
    }
  }, [mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useThemeContext(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return ctx;
}