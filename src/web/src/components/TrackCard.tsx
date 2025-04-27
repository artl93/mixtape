import React, { useState } from 'react';
import { Card, CardContent, CardActions, Button, Typography, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import EditTrackForm from './EditTrackForm';
import TrackAudioPlayer from './TrackAudioPlayer';

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
  const [showActions, setShowActions] = useState(false);
  const [actionsFocused, setActionsFocused] = useState(false);
  const isEditing = editId === track.id;

  // Show actions if card is hovered/focused or any action button is focused
  const shouldShowActions = showActions || actionsFocused;

  // Handle Escape to cancel edit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing && e.key === 'Escape') {
      onEditCancel();
    } else {
      onKeyDown(e, track);
    }
  };

  return (
    <Card
      data-testid="track-card"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      sx={{ outline: isEditing ? '2px solid #1976d2' : undefined, position: 'relative' }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onFocus={() => setShowActions(true)}
      onBlur={(e) => {
        // Only hide if focus moves outside the card and action buttons
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setShowActions(false);
        }
      }}
    >
      <CardContent>
        {isEditing ? (
          <EditTrackForm fields={editFields} onChange={onEditChange} />
        ) : (
          <>
            <Typography variant="h6">{track.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {track.id3?.artist || 'Unknown Artist'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {track.id3?.album || 'Unknown Album'}
            </Typography>
          </>
        )}
      </CardContent>
      <CardActions>
        <Button
          size="small"
          onClick={() => onPlay(track.id)}
          variant={playingId === track.id ? 'contained' : 'outlined'}
          disabled={isEditing}
        >
          {playingId === track.id ? 'Playing' : 'Play'}
        </Button>
        <a href={`${API_BASE}${track.file_url}`} download style={{ textDecoration: 'none' }}>
          <Button size="small" component="span" disabled={isEditing}>
            Download
          </Button>
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
            <IconButton onClick={onEditCancel} aria-label="Cancel" size="small">
              <CancelIcon />
            </IconButton>
          </>
        ) : (
          <span
            style={{ display: shouldShowActions ? 'inline-flex' : 'none', gap: 4 }}
            onFocus={() => setActionsFocused(true)}
            onBlur={(e) => {
              // Only hide if focus moves outside the span and its children
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setActionsFocused(false);
              }
            }}
          >
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
          </span>
        )}
      </CardActions>
      {playingId === track.id && (
        <TrackAudioPlayer src={`${API_BASE}${track.file_url}`} onEnded={() => onPlay(null)} />
      )}
    </Card>
  );
};

export default TrackCard;
