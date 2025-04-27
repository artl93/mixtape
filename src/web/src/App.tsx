import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
  CircularProgress,
  ThemeProvider,
  createTheme,
  useMediaQuery,
  CssBaseline,
  AppBar,
  Toolbar,
  Select,
  MenuItem,
  Box,
  List,
} from '@mui/material';
import TrackCard from './components/TrackCard';
import DeleteDialog from './components/DeleteDialog';
import UploadTrack from './components/UploadTrack';
import BottomPlayerBar from './components/BottomPlayerBar';

interface Track {
  id: number;
  title: string;
  file_url: string;
  id3?: {
    artist?: string | null;
    album?: string | null;
    year?: number | null;
    genre?: string | null;
    duration?: number | null;
    track?: number | null;
    title?: string | null;
  };
}

// Remove hardcoded API_BASE
export function getApiBase(): string {
  // Try window.__MIXTAPE_API_BASE__ if set by server, else env, else default
  if (typeof window !== 'undefined' && (window as any).__MIXTAPE_API_BASE__) {
    return (window as any).__MIXTAPE_API_BASE__;
  }
  // CRA env var
  if (process.env.REACT_APP_API_BASE) {
    return process.env.REACT_APP_API_BASE;
  }
  return 'http://localhost:4000';
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = (..._args: any[]) => undefined;

export default function App() {
  // Theme state: 'light', 'dark', or 'system'
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(
    () => (localStorage.getItem('themeMode') as 'light' | 'dark' | 'system') || 'system',
  );
  // Detect system dark mode
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const resolvedMode = themeMode === 'system' ? (prefersDark ? 'dark' : 'light') : themeMode;
  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);
  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode: resolvedMode },
        components: {
          MuiCard: { styleOverrides: { root: { borderRadius: 12, marginBottom: 8 } } },
        },
      }),
    [resolvedMode],
  );

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState<any>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [playerTrack, setPlayerTrack] = useState<Track | null>(null);
  const [playerPlaying, setPlayerPlaying] = useState(false);

  useEffect(() => {
    axios
      .get(`${getApiBase()}/api/tracks`)
      .then((res) => {
        setTracks(res.data.tracks);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load tracks');
        setLoading(false);
      });
  }, []);

  // Keyboard accessibility: handle Enter/E for edit, Delete for delete
  const handleCardKeyDown = (e: React.KeyboardEvent, track: Track) => {
    if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
      setEditId(track.id);
      setEditFields({
        title: track.title,
        artist: track.id3?.artist || '',
        album: track.id3?.album || '',
        track: track.id3?.track || '',
      });
      e.preventDefault();
    } else if (e.key.toLowerCase() === 'delete') {
      setDeleteId(track.id);
      setConfirmOpen(true);
      e.preventDefault();
    }
  };

  const handleEditChange = (field: string, value: string) => {
    setEditFields((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async (track: Track) => {
    try {
      const patch = {
        title: editFields.title,
        id3: {
          artist: editFields.artist,
          album: editFields.album,
          track: editFields.track ? Number(editFields.track) : null,
        },
      };
      await axios.patch(`${getApiBase()}/api/tracks/${track.id}`, patch);
      setTracks((prev) =>
        prev.map((t) =>
          t.id === track.id
            ? {
                ...t,
                title: patch.title,
                id3: { ...t.id3, ...patch.id3 },
              }
            : t,
        ),
      );
      setEditId(null);
    } catch (err) {
      alert('Failed to save changes.');
    }
  };

  const handleEditCancel = () => {
    setEditId(null);
    setEditFields({});
  };

  const handleDelete = async (trackId: number) => {
    try {
      if (playingId === trackId) setPlayingId(null); // stop playback if deleting playing track
      await axios.delete(`${getApiBase()}/api/tracks/${trackId}`);
      setTracks((prev) => prev.filter((t) => t.id !== trackId));
      setDeleteId(null);
      setConfirmOpen(false);
    } catch (err) {
      alert('Failed to delete track.');
    }
  };

  // Add upload handler
  const handleUploadSuccess = (newTrack: Track) => {
    setTracks((prev) => [newTrack, ...prev]);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" color="default" elevation={0} sx={{ mb: 2 }}>
        <Toolbar>
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            Mixtape
          </Typography>
          <Box sx={{ minWidth: 120 }}>
            <Select
              size="small"
              value={themeMode}
              onChange={(e) => setThemeMode(e.target.value as any)}
              sx={{ fontSize: 14 }}
              aria-label="Theme mode"
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
              <MenuItem value="system">System</MenuItem>
            </Select>
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 2 }}>
        <UploadTrack onUploadSuccess={handleUploadSuccess} apiBase={getApiBase()} />
        <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <DeleteDialog
            open={confirmOpen}
            onCancel={() => setConfirmOpen(false)}
            onDelete={() => handleDelete(deleteId!)}
          />
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              playingId={
                playerTrack && playerTrack.id === track.id && playerPlaying ? track.id : null
              }
              editId={editId}
              editFields={editFields}
              onPlay={(id) => {
                if (id === null) {
                  setPlayerPlaying(false);
                } else {
                  const t = tracks.find((t) => t.id === id);
                  if (t) {
                    setPlayerTrack(t);
                    setPlayerPlaying(true);
                  }
                }
              }}
              onEdit={(t) => {
                setEditId(t.id);
                setEditFields({
                  title: t.title,
                  artist: t.id3?.artist || '',
                  album: t.id3?.album || '',
                  track: t.id3?.track || '',
                });
              }}
              onEditChange={handleEditChange}
              onEditSave={handleEditSave}
              onEditCancel={handleEditCancel}
              onDeleteRequest={(id) => {
                if (playerTrack && playerTrack.id === id) setPlayerPlaying(false);
                setDeleteId(id);
                setConfirmOpen(true);
              }}
              onKeyDown={handleCardKeyDown}
              API_BASE={getApiBase()}
              onRequestStopPlaying={() => setPlayerPlaying(false)}
            />
          ))}
        </List>
      </Container>
      <BottomPlayerBar
        track={playerTrack}
        playing={playerPlaying}
        onPlayPause={() => setPlayerPlaying((p) => !p)}
        onSeek={noop}
        onEnded={() => setPlayerPlaying(false)}
        API_BASE={getApiBase()}
      />
    </ThemeProvider>
  );
}
