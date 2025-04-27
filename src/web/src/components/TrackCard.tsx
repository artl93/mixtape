import React, { useState } from 'react';
import {
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import DownloadIcon from '@mui/icons-material/Download';

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

interface TrackCardProps {
  track: Track;
  playingId: number | null;
  editId: number | null;
  editFields: any;
  onPlay: (id: number | null) => void;
  onEdit: (track: Track) => void;
  onEditChange: (field: string, value: string) => void;
  onEditSave: (track: Track) => void;
  onEditCancel: () => void;
  onDeleteRequest: (id: number) => void;
  onKeyDown: (e: React.KeyboardEvent, track: Track) => void;
  API_BASE: string;
  onRequestStopPlaying?: () => void;
}

const TrackCard: React.FC<TrackCardProps> = ({
  track,
  playingId,
  editId,
  editFields,
  onPlay,
  onEdit,
  onEditChange,
  onEditSave,
  onEditCancel,
  onDeleteRequest,
  onKeyDown,
  API_BASE,
  onRequestStopPlaying,
}) => {
  // Only show actions if the row is hovered or focused (not when action buttons are focused)
  const [showActions, setShowActions] = useState(false);
  const isEditing = editId === track.id;

  // Handle Escape to cancel edit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing && e.key === 'Escape') {
      onEditCancel();
    } else {
      onKeyDown(e, track);
    }
  };

  // Use a wrapper div to capture mouse events for the whole row, including actions
  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <ListItem
        data-testid="track-card"
        sx={{
          bgcolor: isEditing ? 'action.selected' : 'background.paper',
          borderRadius: 2,
          mb: 1,
          boxShadow: isEditing ? 2 : 0,
          display: 'flex',
          alignItems: 'center',
          minHeight: 64,
          px: 2,
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowActions(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setShowActions(false);
          }
        }}
        tabIndex={0}
      >
        <ListItemAvatar>
          <Avatar
            sx={{
              bgcolor: playingId === track.id ? 'primary.main' : 'background.paper',
              color: playingId === track.id ? 'common.white' : 'primary.main',
              transition: 'all 0.2s',
            }}
          >
            {playingId === track.id ? <PauseIcon /> : <PlayArrowIcon />}
          </Avatar>
        </ListItemAvatar>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          {isEditing ? (
            <>
              <TextField
                variant="standard"
                value={editFields.title}
                onChange={(e) => onEditChange('title', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onEditSave(track);
                  if (e.key === 'Escape') onEditCancel();
                }}
                sx={{ minWidth: 120, flex: 2 }}
                inputProps={{ 'aria-label': 'Edit title', 'data-testid': 'edit-title' }}
                autoFocus
              />
              <TextField
                variant="standard"
                value={editFields.artist}
                onChange={(e) => onEditChange('artist', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onEditSave(track);
                  if (e.key === 'Escape') onEditCancel();
                }}
                sx={{ minWidth: 100, flex: 1 }}
                inputProps={{ 'aria-label': 'Edit artist', 'data-testid': 'edit-artist' }}
              />
              <TextField
                variant="standard"
                value={editFields.album}
                onChange={(e) => onEditChange('album', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onEditSave(track);
                  if (e.key === 'Escape') onEditCancel();
                }}
                sx={{ minWidth: 100, flex: 1 }}
                inputProps={{ 'aria-label': 'Edit album', 'data-testid': 'edit-album' }}
              />
              <TextField
                variant="standard"
                value={editFields.track}
                onChange={(e) => onEditChange('track', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onEditSave(track);
                  if (e.key === 'Escape') onEditCancel();
                }}
                sx={{ width: 60 }}
                inputProps={{
                  'aria-label': 'Edit track number',
                  'data-testid': 'edit-track',
                  type: 'number',
                }}
              />
            </>
          ) : (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, flex: 2 }}>
                {track.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                {track.id3?.artist || 'Unknown Artist'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                {track.id3?.album || 'Unknown Album'}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ width: 40, textAlign: 'right' }}
              >
                {track.id3?.track || ''}
              </Typography>
            </>
          )}
        </Box>
        {/* Action icons, always reserve space, fade in/out */}
        <Box
          sx={{
            width: 220, // enough for all icons, adjust as needed
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            ml: 2,
            opacity: showActions || isEditing ? 1 : 0.15,
            pointerEvents: showActions || isEditing ? 'auto' : 'none',
            transition: 'opacity 0.2s',
          }}
        >
          <IconButton
            size="small"
            onClick={() => onPlay(playingId === track.id ? null : track.id)}
            color={playingId === track.id ? 'primary' : 'default'}
            disabled={isEditing}
            aria-label={playingId === track.id ? 'Pause' : 'Play'}
          >
            {playingId === track.id ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
          <a href={`${API_BASE}${track.file_url}`} download style={{ textDecoration: 'none' }}>
            <IconButton size="small" disabled={isEditing} aria-label="Download">
              <DownloadIcon />
            </IconButton>
          </a>
          {isEditing ? (
            <>
              <IconButton
                color="primary"
                onClick={() => onEditSave(track)}
                aria-label="Save"
                size="small"
              >
                <SaveIcon />
              </IconButton>
              <IconButton
                onClick={() => {
                  onEditCancel();
                }}
                aria-label="Cancel"
                size="small"
              >
                <CancelIcon />
              </IconButton>
            </>
          ) : (
            <>
              <IconButton
                color="primary"
                onClick={() => onEdit(track)}
                aria-label="Edit"
                size="small"
              >
                <EditIcon />
              </IconButton>
              <IconButton
                color="error"
                onClick={() => {
                  if (onRequestStopPlaying) onRequestStopPlaying();
                  onDeleteRequest(track.id);
                }}
                aria-label="Delete"
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </>
          )}
        </Box>
      </ListItem>
    </div>
  );
};

export default TrackCard;
