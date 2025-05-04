import React from 'react';
import { Select, MenuItem, Box } from '@mui/material';
import type { ThemeMode } from '../types';

interface ThemeSelectorProps {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ themeMode, onThemeChange }) => (
  <Box sx={{ minWidth: 120 }}>
    <Select
      size="small"
      value={themeMode}
      onChange={(e) => onThemeChange(e.target.value as ThemeMode)}
      sx={{ fontSize: 14 }}
      aria-label="Theme mode"
    >
      <MenuItem value="light">Light</MenuItem>
      <MenuItem value="dark">Dark</MenuItem>
      <MenuItem value="system">System</MenuItem>
    </Select>
  </Box>
);
