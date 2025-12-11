import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import type { Track, EditFields } from '../types';
import { getApiBase } from '../utils/api';

export const useTracks = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get(`${getApiBase()}/api/tracks`)
      .then((res) => {
        setTracks(res.data.tracks);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load tracks');
        setLoading(false);
      });
  }, []);

  const addTrack = (newTrack: Track) => {
    setTracks((prev) => [newTrack, ...prev]);
  };

  const updateTrack = async (trackId: number, editFields: EditFields) => {
    try {
      const patch = {
        title: editFields.title,
        id3: {
          artist: editFields.artist,
          album: editFields.album,
          track: editFields.track ? Number(editFields.track) : null,
        },
      };
      await axios.patch(`${getApiBase()}/api/tracks/${trackId}`, patch);
      setTracks((prev) =>
        prev.map((t) =>
          t.id === trackId
            ? {
                ...t,
                title: patch.title,
                id3: { ...t.id3, ...patch.id3 },
              }
            : t,
        ),
      );
      return true;
    } catch (err) {
      return false;
    }
  };

  const deleteTrack = async (trackId: number) => {
    try {
      await axios.delete(`${getApiBase()}/api/tracks/${trackId}`);
      setTracks((prev) => prev.filter((t) => t.id !== trackId));
      return true;
    } catch (err) {
      return false;
    }
  };

  return {
    tracks,
    loading,
    error,
    addTrack,
    updateTrack,
    deleteTrack,
  };
};

export const usePlayer = () => {
  const [playerTrack, setPlayerTrack] = useState<Track | null>(null);
  const [playerPlaying, setPlayerPlaying] = useState(false);

  const playTrack = (track: Track | null) => {
    if (!track) {
      setPlayerPlaying(false);
      setPlayerTrack(null);
      return;
    }

    // If we're already playing this track, just toggle
    if (playerTrack && playerTrack.id === track.id) {
      setPlayerPlaying(!playerPlaying);
      return;
    }

    // New track - set it and start playing
    setPlayerTrack(track);
    setPlayerPlaying(true);
  };

  const stopPlayback = () => {
    setPlayerPlaying(false);
  };

  const togglePlayPause = () => {
    setPlayerPlaying((prev) => !prev);
  };

  return {
    playerTrack,
    playerPlaying,
    playTrack,
    stopPlayback,
    togglePlayPause,
  };
};

export const useEditTrack = () => {
  const [editId, setEditId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState<EditFields>({
    title: '',
    artist: '',
    album: '',
    track: '',
  });

  const startEdit = (track: Track) => {
    setEditId(track.id);
    setEditFields({
      title: track.title,
      artist: track.id3?.artist || '',
      album: track.id3?.album || '',
      track: track.id3?.track || '',
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditFields({
      title: '',
      artist: '',
      album: '',
      track: '',
    });
  };

  const updateField = (field: string, value: string) => {
    setEditFields((prev) => ({ ...prev, [field]: value }));
  };

  return {
    editId,
    editFields,
    startEdit,
    cancelEdit,
    updateField,
  };
};
