import { useState, useEffect, useCallback } from 'react';

const THEME_STORAGE_KEY = 'theme';

/**
 * Obtiene el tema inicial desde localStorage o desde la preferencia del sistema operativo.
 */
const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch {
      // ignore
    }

    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return 'light';
};

/**
 * Hook centralizado para gestión de Tema Claro (Light) / Oscuro (Dark).
 * Aplica class="dark" y data-theme="dark/light" al elemento raíz <html> y sincroniza con localStorage.
 */
export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  // Aplicar tema al DOM cada vez que cambie
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (theme === 'dark') {
      root.classList.add('dark');
      if (body) body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      if (body) body.classList.remove('dark');
    }

    root.setAttribute('data-theme', theme);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Alternar entre light y dark
  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme
  };
}
