import React, { useState, useRef, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Slider,
  LinearProgress,
} from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';
import type { Track } from '../types';

// Export the props type to make it available for other files
export type BottomPlayerBarProps = {
  track: Track | null;
  playing: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onEnded: () => void;
  API_BASE: string;
};

/**
 * Audio player component that displays at the bottom of the screen
 *
 * Key features:
 * 1. Play/pause/restart audio playback
 * 2. Show and control playback position with a slider
 * 3. Display current time and track duration
 */
export const BottomPlayerBar: React.FC<BottomPlayerBarProps> = ({
  track,
  playing,
  onPlayPause,
  onSeek,
  onEnded,
  API_BASE,
}) => {
  // Audio element reference and state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Reset progress when track changes
  useEffect(() => {
    setProgress(0);
    setIsLoading(track != null);

    // Set duration from track metadata if available
    if (track?.id3?.duration) {
      setDuration(track.id3.duration);
    } else {
      setDuration(0);
    }
  }, [track]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle audio element initialization and cleanup
  useEffect(() => {
    // Pause any previous audio when component unmounts
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Handle play/pause state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;

    if (playing) {
      // Store current track ID to handle async completion
      const currentTrackId = track.id;
      setIsLoading(true);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (track.id === currentTrackId) {
              setIsLoading(false);
            }
          })
          .catch((err) => {
            console.error('Playback failed', err);
            if (track.id === currentTrackId) {
              setIsLoading(false);
              onPlayPause(); // Tell parent playback failed
            }
          });
      }
    } else {
      audio.pause();
      setIsLoading(false);
    }
  }, [playing, onPlayPause, track]);

  if (!track) return null;

  return (
    <AppBar
      position="fixed"
      color="default"
      sx={{ top: 'auto', bottom: 0 }}
      role="region"
      aria-label="player"
    >
      {isLoading && <LinearProgress />}
      <Toolbar variant="dense">
        <IconButton
          onClick={onPlayPause}
          aria-label={playing ? 'pause' : 'play'}
          data-testid={playing ? 'pause-button' : 'play-button'}
        >
          {playing ? <Pause /> : <PlayArrow />}
        </IconButton>
        <Box sx={{ ml: 2, flexGrow: 1 }}>
          <Typography variant="body1" component="div" data-testid="track-title">
            {track.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            component="div"
            data-testid="track-artist"
          >
            {track.id3?.artist || 'Unknown Artist'}
          </Typography>
        </Box>
        <Box sx={{ width: 300, mx: 2 }}>
          {duration > 0 && (
            <>
              <Slider
                size="small"
                value={progress}
                max={duration}
                data-testid="progress-slider"
                onChange={(_, value) => {
                  const audio = audioRef.current;
                  const numValue = value as number;
                  if (audio && isFinite(numValue)) {
                    try {
                      audio.currentTime = numValue;
                      setProgress(numValue);
                      onSeek(numValue);
                    } catch (err) {
                      console.error('Could not seek:', err);
                    }
                  }
                }}
                aria-label="track progress"
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => formatTime(value)}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ minWidth: 120, textAlign: 'center', display: 'block' }}
                data-testid="time-display"
              >
                {formatTime(progress)} / {formatTime(duration)}
              </Typography>
            </>
          )}
          {duration <= 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'flex', justifyContent: 'center' }}
            >
              Loading track information...
            </Typography>
          )}
        </Box>
        <audio
          ref={audioRef}
          src={`${API_BASE}${track.file_url}`}
          onTimeUpdate={(e) => {
            const audio = e.currentTarget;
            if (isFinite(audio.currentTime)) {
              setProgress(audio.currentTime);
            }
          }}
          onLoadedMetadata={(e) => {
            const audio = e.currentTarget;
            if (isFinite(audio.duration) && audio.duration > 0) {
              setDuration(audio.duration);
              setIsLoading(false);
            }
          }}
          onEnded={onEnded}
          onError={(e) => {
            console.error('Audio error:', e);
            setIsLoading(false);
            onPlayPause(); // Reset playing state on error
          }}
          preload="metadata"
          data-testid="audio-element"
        />
      </Toolbar>
    </AppBar>
  );
};

// Export the component as the default export
export default BottomPlayerBar;
