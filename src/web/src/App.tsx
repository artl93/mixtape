import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Typography, Grid, CircularProgress } from '@mui/material';
import TrackCard from './components/TrackCard';
import DeleteDialog from './components/DeleteDialog';
import UploadTrack from './components/UploadTrack';

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

const API_BASE = 'http://localhost:4000';

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState<any>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/tracks`)
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
    } else if (e.key === 'Delete') {
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
      await axios.patch(`${API_BASE}/api/tracks/${track.id}`, patch);
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
      await axios.delete(`${API_BASE}/api/tracks/${trackId}`);
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
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h3" gutterBottom>
        Mixtape: All Tracks
      </Typography>
      <UploadTrack onUploadSuccess={handleUploadSuccess} />
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          <DeleteDialog
            open={confirmOpen}
            onCancel={() => setConfirmOpen(false)}
            onDelete={() => handleDelete(deleteId!)}
          />
          <Grid container spacing={2}>
            {tracks.map((track) => (
              <Grid item xs={12} md={6} key={track.id}>
                <TrackCard
                  track={track}
                  playingId={playingId}
                  editId={editId}
                  editFields={editFields}
                  onPlay={(id) => setPlayingId(id)}
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
                    if (playingId === id) setPlayingId(null); // stop playback immediately when delete is requested
                    setDeleteId(id);
                    setConfirmOpen(true);
                  }}
                  onKeyDown={handleCardKeyDown}
                  API_BASE={API_BASE}
                  onRequestStopPlaying={() => setPlayingId(null)}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
}
