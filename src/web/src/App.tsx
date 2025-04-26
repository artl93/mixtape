import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  CircularProgress,
} from '@mui/material';

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

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h3" gutterBottom>
        Mixtape: All Tracks
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Grid container spacing={2}>
          {tracks.map((track) => (
            <Grid item xs={12} md={6} key={track.id}>
              <Card data-testid="track-card">
                <CardContent>
                  <Typography variant="h6">{track.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {track.id3?.artist || 'Unknown Artist'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {track.id3?.album || 'Unknown Album'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => setPlayingId(track.id)}
                    variant={playingId === track.id ? 'contained' : 'outlined'}
                  >
                    {playingId === track.id ? 'Playing' : 'Play'}
                  </Button>
                  {/* Use a real <a> tag with download attribute for browser compatibility */}
                  <a
                    href={`${API_BASE}${track.file_url}`}
                    download
                    style={{ textDecoration: 'none' }}
                  >
                    <Button size="small" component="span">
                      Download
                    </Button>
                  </a>
                </CardActions>
                {playingId === track.id && (
                  <audio
                    src={`${API_BASE}${track.file_url}`}
                    controls
                    autoPlay
                    onEnded={() => setPlayingId(null)}
                    style={{ width: '100%' }}
                  />
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
