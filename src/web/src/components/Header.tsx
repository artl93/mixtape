import React from 'react';
import { AppBar, Toolbar, Typography, Button, Avatar, Box } from '@mui/material';
import { ThemeSelector } from './ThemeSelector';
import type { ThemeMode, User } from '../types';

interface HeaderProps {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  user?: User | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ themeMode, onThemeChange, user, onLogout }) => (
  <AppBar position="static" color="default" elevation={0} sx={{ mb: 2 }}>
    <Toolbar>
      <Typography variant="h5" sx={{ flexGrow: 1 }}>
        Mixtape
      </Typography>
      {user && (
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <Avatar
            src={user.profile_picture || undefined}
            alt={user.display_name}
            sx={{ width: 32, height: 32, mr: 1 }}
          />
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user.display_name}
          </Typography>
          <Button variant="outlined" size="small" onClick={onLogout}>
            Logout
          </Button>
        </Box>
      )}
      <ThemeSelector themeMode={themeMode} onThemeChange={onThemeChange} />
    </Toolbar>
  </AppBar>
);
