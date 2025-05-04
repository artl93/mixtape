import { useMemo } from 'react';
import { createTheme } from '@mui/material';
import type { ThemeMode } from '../types';

export const useAppTheme = (resolvedMode: 'light' | 'dark') => {
  return useMemo(
    () =>
      createTheme({
        palette: { mode: resolvedMode },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                marginBottom: 8,
              },
            },
          },
        },
      }),
    [resolvedMode],
  );
};

export const getInitialThemeMode = (): ThemeMode => {
  return (localStorage.getItem('themeMode') as ThemeMode) || 'system';
};
