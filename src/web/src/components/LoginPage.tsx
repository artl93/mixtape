import React from 'react';
import { Box, Button, Typography, Paper, Container } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Welcome to Mixtape
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Please sign in with your Google account to access your music collection.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={onLogin}
            sx={{
              mt: 2,
              py: 1.5,
              px: 4,
              textTransform: 'none',
              fontSize: '1.1rem',
            }}
          >
            Sign in with Google
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};
