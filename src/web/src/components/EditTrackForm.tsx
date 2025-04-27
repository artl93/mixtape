import React from 'react';
import { TextField } from '@mui/material';

interface EditTrackFormProps {
  fields: {
    title: string;
    artist: string;
    album: string;
    track: string;
  };
  onChange: (field: string, value: string) => void;
}

const EditTrackForm: React.FC<EditTrackFormProps> = ({ fields, onChange }) => (
  <>
    <TextField
      label="Title"
      value={fields.title}
      onChange={(e) => onChange('title', e.target.value)}
      fullWidth
      margin="dense"
      autoFocus
    />
    <TextField
      label="Artist"
      value={fields.artist}
      onChange={(e) => onChange('artist', e.target.value)}
      fullWidth
      margin="dense"
    />
    <TextField
      label="Album"
      value={fields.album}
      onChange={(e) => onChange('album', e.target.value)}
      fullWidth
      margin="dense"
    />
    <TextField
      label="Track #"
      value={fields.track}
      onChange={(e) => onChange('track', e.target.value)}
      fullWidth
      margin="dense"
      type="number"
    />
  </>
);

export default EditTrackForm;
