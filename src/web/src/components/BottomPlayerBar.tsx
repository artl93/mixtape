import React, { useRef, useEffect } from 'react';
import { Box, IconButton, Typography, Slider, useTheme, Paper } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

interface BottomPlayerBarProps {
  track: {
    title: string;
    id3?: { artist?: string | null; album?: string | null };
    file_url: string;
  } | null;
  playing: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onEnded: () => void;
  API_BASE: string;
}

export const BottomPlayerBar: React.FC<BottomPlayerBarProps> = ({
  track,
  playing,
  onPlayPause,
  onSeek,
  onEnded,
  API_BASE,
}) => {
  const theme = useTheme();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [sliderValue, setSliderValue] = React.useState(0);
  const [isSeeking, setIsSeeking] = React.useState(false);
  const [shouldAutoPlay, setShouldAutoPlay] = React.useState(false);
  // Track if the user has manually moved the slider (seeked)
  const [hasSeeked, setHasSeeked] = React.useState(false);

  // Remove this effect, as it causes a race with shouldAutoPlay logic
  // useEffect(() => {
  //   if (audioRef.current && track) {
  //     if (playing) audioRef.current.play();
  //     else audioRef.current.pause();
  //   }
  // }, [playing, track]);

  // Instead, only control play/pause after metadata is loaded or when toggling play
  useEffect(() => {
    if (audioRef.current && !playing) {
      audioRef.current.pause();
    }
    // If playing is true, let shouldAutoPlay/onLoadedMetadata handle play()
  }, [playing]);

  // Keep slider in sync with currentTime, unless user is seeking
  useEffect(() => {
    if (!isSeeking) setSliderValue(currentTime);
  }, [currentTime, isSeeking]);

  // When track changes, update audio src imperatively and reset state
  useEffect(() => {
    if (audioRef.current && track) {
      const filename = track.file_url.split('/').pop();
      audioRef.current.src = `${API_BASE}/api/tracks/stream/${filename}`;
      audioRef.current.load();
      setCurrentTime(0);
      setDuration(0);
      setSliderValue(0);
      setIsSeeking(false);
      setHasSeeked(false);
      if (playing) setShouldAutoPlay(true);
    }
  }, [track, API_BASE]);

  // When play is pressed after seeking, ensure playback resumes
  useEffect(() => {
    if (audioRef.current && playing) {
      // If the user has seeked, call play() again to resume
      if (hasSeeked) {
        audioRef.current.play();
        setHasSeeked(false);
      }
    }
  }, [playing, hasSeeked]);

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };
  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
    if (shouldAutoPlay && audioRef.current) {
      audioRef.current.play();
      setShouldAutoPlay(false);
    }
  };
  // Only allow seeking if duration is finite and > 0
  const handleSliderChange = (_: any, value: number | number[]) => {
    if (
      typeof value === 'number' &&
      isFinite(duration) &&
      duration > 0 &&
      value >= 0 &&
      value <= duration
    ) {
      setIsSeeking(true);
      setSliderValue(value);
    }
  };
  const handleSliderCommit = (_: any, value: number | number[]) => {
    if (
      audioRef.current &&
      typeof value === 'number' &&
      isFinite(duration) &&
      duration > 0 &&
      value >= 0 &&
      value <= duration &&
      isFinite(value)
    ) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
      setSliderValue(value);
      setIsSeeking(false);
      setHasSeeked(true); // Mark that the user has seeked
      onSeek(value);
    } else {
      setIsSeeking(false);
    }
  };

  if (!track) return null;

  return (
    <Paper
      role="region"
      aria-label="Player"
      elevation={8}
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1300,
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderTop: `1px solid ${theme.palette.divider}`,
        px: 2,
        py: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <IconButton onClick={onPlayPause} color="primary" size="large">
        {playing ? <PauseIcon /> : <PlayArrowIcon />}
      </IconButton>
      <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
        <Typography noWrap fontWeight={500}>
          {track.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {track.id3?.artist || 'Unknown Artist'} — {track.id3?.album || 'Unknown Album'}
        </Typography>
      </Box>
      <Slider
        min={0}
        max={duration || 1}
        value={sliderValue}
        onChange={handleSliderChange}
        onChangeCommitted={handleSliderCommit}
        sx={{ width: 200, mx: 2 }}
        size="small"
      />
      <Typography variant="caption" sx={{ minWidth: 60, textAlign: 'right' }}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </Typography>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onEnded}
        style={{ display: 'none' }}
      />
    </Paper>
  );
};

function formatTime(sec: number) {
  if (!isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default BottomPlayerBar;
