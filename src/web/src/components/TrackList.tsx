import React from 'react';
import { List } from '@mui/material';
import type { EditFields, Track } from '../types';
import TrackCard from './TrackCard';
import DeleteDialog from './DeleteDialog';
import { getApiBase } from '../utils/api';

interface TrackListProps {
  tracks: Track[];
  editId: number | null;
  editFields: EditFields;
  playerTrack: Track | null;
  playerPlaying: boolean;
  confirmOpen: boolean;
  deleteId: number | null;
  onEditStart: (track: Track) => void;
  onEditChange: (field: string, value: string) => void;
  onEditSave: (track: Track) => Promise<void>;
  onEditCancel: () => void;
  onDeleteRequest: (id: number) => void;
  onDeleteConfirm: () => Promise<void>;
  onDeleteCancel: () => void;
  onPlay: (track: Track | null) => void;
  onStopPlaying: () => void;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  editId,
  editFields,
  playerTrack,
  playerPlaying,
  confirmOpen,
  deleteId,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onPlay,
  onStopPlaying,
}) => {
  // Keyboard accessibility: handle Enter/E for edit, Delete for delete
  const handleCardKeyDown = (e: React.KeyboardEvent, track: Track) => {
    if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
      onEditStart(track);
      e.preventDefault();
    } else if (e.key.toLowerCase() === 'delete') {
      onDeleteRequest(track.id);
      e.preventDefault();
    }
  };

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
      <DeleteDialog open={confirmOpen} onCancel={onDeleteCancel} onDelete={onDeleteConfirm} />
      {tracks.map((track) => (
        <TrackCard
          key={track.id}
          track={track}
          playingId={playerTrack && playerTrack.id === track.id && playerPlaying ? track.id : null}
          editId={editId}
          editFields={editFields}
          onPlay={(id) => {
            if (id === null) {
              onStopPlaying();
            } else {
              onPlay(track);
            }
          }}
          onEdit={() => onEditStart(track)}
          onEditChange={onEditChange}
          onEditSave={() => onEditSave(track)}
          onEditCancel={onEditCancel}
          onDeleteRequest={(id) => {
            if (playerTrack && playerTrack.id === id) onStopPlaying();
            onDeleteRequest(id);
          }}
          onKeyDown={handleCardKeyDown}
          API_BASE={getApiBase()}
          onRequestStopPlaying={onStopPlaying}
        />
      ))}
    </List>
  );
};
