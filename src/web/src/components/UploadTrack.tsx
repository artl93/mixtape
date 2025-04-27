import React, { useRef, useState } from 'react';
import { Paper, Button, useTheme, Box } from '@mui/material';

interface UploadTrackProps {
  onUploadSuccess?: (track: any) => void;
  apiBase: string;
}

const UploadTrack: React.FC<UploadTrackProps> = ({ onUploadSuccess, apiBase }) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    setProgress(0);
    const file = files[0];
    const title = file.name.replace(/\.[^/.]+$/, '');
    const user_id = '1'; // TODO: Replace with real user ID
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('title', title);
    formData.append('user_id', user_id);
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${apiBase}/api/tracks/upload`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        setUploading(false);
        if (xhr.status === 201) {
          setProgress(100);
          if (onUploadSuccess) {
            onUploadSuccess(JSON.parse(xhr.responseText).track);
          }
        } else {
          setError('Upload failed: ' + xhr.statusText);
        }
      };
      xhr.onerror = () => {
        setUploading(false);
        setError('Upload failed: Network error');
      };
      xhr.send(formData);
    } catch (err) {
      setUploading(false);
      setError('Upload failed: ' + (err as Error).message);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <Paper
      elevation={dragActive ? 6 : 2}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragActive(false);
      }}
      onDrop={handleDrop}
      sx={{
        border: dragActive
          ? `2px solid ${theme.palette.primary.main}`
          : `2px dashed ${theme.palette.divider}`,
        borderRadius: 2,
        p: 0,
        textAlign: 'center',
        bgcolor: dragActive
          ? theme.palette.mode === 'dark'
            ? theme.palette.action.selected
            : theme.palette.primary.light
          : theme.palette.background.paper,
        position: 'relative',
        my: 2,
        transition: 'background 0.2s, border 0.2s',
        height: 160,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 520,
        mx: 'auto',
      }}
    >
      <input
        type="file"
        accept="audio/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleInputChange}
        disabled={uploading}
      />
      <Button
        variant="outlined"
        color="primary"
        onClick={handleButtonClick}
        disabled={uploading}
        sx={{
          width: 56,
          height: 56,
          minWidth: 0,
          minHeight: 0,
          borderRadius: '50%',
          mb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          p: 0,
        }}
        aria-label="Upload audio track"
      >
        +
      </Button>
      <Box sx={{ mt: 1, color: theme.palette.text.secondary, fontSize: 18 }}>
        Drag & drop an audio file here, or click + to select
      </Box>
      {uploading && <Box sx={{ mt: 2 }}>{`Uploading... ${progress}%`}</Box>}
      {error && <Box sx={{ color: theme.palette.error.main, mt: 2 }}>{error}</Box>}
    </Paper>
  );
};

export default UploadTrack;
