import React, { useRef, useState } from 'react';

interface UploadTrackProps {
  onUploadSuccess?: (track: any) => void;
  apiBase: string;
}

const UploadTrack: React.FC<UploadTrackProps> = ({ onUploadSuccess, apiBase }) => {
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
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragActive(false);
      }}
      onDrop={handleDrop}
      style={{
        border: dragActive ? '2px solid #1976d2' : '2px dashed #aaa',
        borderRadius: 8,
        padding: 24,
        textAlign: 'center',
        background: dragActive ? '#e3f2fd' : '#fafafa',
        position: 'relative',
        margin: '16px 0',
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
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={uploading}
        style={{
          fontSize: 32,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: '#1976d2',
        }}
        aria-label="Upload audio track"
      >
        +
      </button>
      <div style={{ marginTop: 8, color: '#555' }}>
        Drag & drop an audio file here, or click + to select
      </div>
      {uploading && <div style={{ marginTop: 12 }}>Uploading... {progress}%</div>}
      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
    </div>
  );
};

export default UploadTrack;
