import React from 'react';

interface TrackAudioPlayerProps {
  src: string;
  onEnded: () => void;
}

const TrackAudioPlayer: React.FC<TrackAudioPlayerProps> = ({ src, onEnded }) => (
  <audio src={src} controls autoPlay onEnded={onEnded} style={{ width: '100%' }} />
);

export default TrackAudioPlayer;
