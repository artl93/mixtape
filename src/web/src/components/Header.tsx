import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';
import { ThemeSelector } from './ThemeSelector';
import type { ThemeMode } from '../types';

interface HeaderProps {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ themeMode, onThemeChange }) => (
  <AppBar position="static" color="default" elevation={0} sx={{ mb: 2 }}>
    <Toolbar>
      <Typography variant="h5" sx={{ flexGrow: 1 }}>
        Mixtape
      </Typography>
      <ThemeSelector themeMode={themeMode} onThemeChange={onThemeChange} />
    </Toolbar>
  </AppBar>
);
