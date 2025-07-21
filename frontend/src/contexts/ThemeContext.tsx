'use client';
import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import type { JSX } from 'react';

interface ThemeContextType {
  theme: string;
  resolvedTheme: string;
  setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [theme, setTheme] = useState<string>('system');
  const [resolvedTheme, setResolvedTheme] = useState<string>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      const root = window.document.documentElement;
      let newResolvedTheme = theme;
      if (theme === 'system') {
        newResolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      setResolvedTheme(newResolvedTheme);
      root.classList.remove('light', 'dark');
      root.classList.add(newResolvedTheme);
      localStorage.setItem('theme', theme);
    };
    applyTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setThemeMode = (newTheme: string) => {
    setTheme(newTheme);
  };

  // Explicitly return JSX
  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
