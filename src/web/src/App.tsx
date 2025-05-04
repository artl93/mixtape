import React, { useState, useEffect } from 'react';
import { Container, ThemeProvider, useMediaQuery, CssBaseline } from '@mui/material';
import type { Track } from './types';
import type { ThemeMode } from './types';
import { Header } from './components/Header';
import { TrackList } from './components/TrackList';
import UploadTrack from './components/UploadTrack';
import { BottomPlayerBar } from './components/BottomPlayerBar';
import { useTracks, usePlayer, useEditTrack } from './hooks';
import { useAppTheme, getInitialThemeMode } from './theme';
import { getApiBase } from './utils/api';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = (..._args: any[]) => undefined;

export default function App() {
  // Theme management
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode());
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const resolvedMode = themeMode === 'system' ? (prefersDark ? 'dark' : 'light') : themeMode;

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  const theme = useAppTheme(resolvedMode);

  // Track management
  const { tracks, loading, error, addTrack, updateTrack, deleteTrack } = useTracks();
  const { playerTrack, playerPlaying, playTrack, stopPlayback, togglePlayPause } = usePlayer();
  const { editId, editFields, startEdit, cancelEdit, updateField } = useEditTrack();

  // Delete dialog state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Delete handlers
  const handleDeleteRequest = (id: number) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      const success = await deleteTrack(deleteId);
      if (!success) {
        alert('Failed to delete track.');
      }
      setDeleteId(null);
      setConfirmOpen(false);
    }
  };

  const handleEditSave = async (track: Track) => {
    const success = await updateTrack(track.id, editFields);
    if (!success) {
      alert('Failed to save changes.');
    } else {
      cancelEdit();
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header themeMode={themeMode} onThemeChange={setThemeMode} />
      <Container maxWidth="md" sx={{ mt: 2 }}>
        <UploadTrack onUploadSuccess={addTrack} apiBase={getApiBase()} />
        <TrackList
          tracks={tracks}
          editId={editId}
          editFields={editFields}
          playerTrack={playerTrack}
          playerPlaying={playerPlaying}
          confirmOpen={confirmOpen}
          deleteId={deleteId}
          onEditStart={startEdit}
          onEditChange={updateField}
          onEditSave={handleEditSave}
          onEditCancel={cancelEdit}
          onDeleteRequest={handleDeleteRequest}
          onDeleteConfirm={handleDeleteConfirm}
          onDeleteCancel={() => setConfirmOpen(false)}
          onPlay={playTrack}
          onStopPlaying={stopPlayback}
        />
      </Container>
      <BottomPlayerBar
        track={playerTrack}
        playing={playerPlaying}
        onPlayPause={togglePlayPause}
        onSeek={noop}
        onEnded={stopPlayback}
        API_BASE={getApiBase()}
      />
    </ThemeProvider>
  );
}
