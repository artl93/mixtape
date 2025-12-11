import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomPlayerBar } from '../BottomPlayerBar';
import type { Track } from '../../types';

// Fix jest-dom types
import '@testing-library/jest-dom';

// Create a sample track for testing
const mockTrack: Track = {
  id: 1,
  title: 'Test Song',
  file_url: '/api/tracks/1/stream',
  id3: {
    artist: 'Test Artist',
    album: 'Test Album',
    duration: 180, // 3 minutes in seconds
    title: 'Test Song',
    track: 1,
  },
};

describe('BottomPlayerBar Simple Tests', () => {
  // Test 1: Component renders correctly with track info
  test('renders track title and artist', () => {
    render(
      <BottomPlayerBar
        track={mockTrack}
        playing={false}
        onPlayPause={() => {}}
        onSeek={() => {}}
        onEnded={() => {}}
        API_BASE=""
      />,
    );

    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
    expect(screen.getByLabelText('play')).toBeInTheDocument();
  });

  // Test 2: Shows pause button when playing
  test('shows pause button when playing', () => {
    render(
      <BottomPlayerBar
        track={mockTrack}
        playing={true}
        onPlayPause={() => {}}
        onSeek={() => {}}
        onEnded={() => {}}
        API_BASE=""
      />,
    );

    expect(screen.getByLabelText('pause')).toBeInTheDocument();
  });

  // Test 3: Does not render when no track
  test('does not render when no track provided', () => {
    const { container } = render(
      <BottomPlayerBar
        track={null}
        playing={false}
        onPlayPause={() => {}}
        onSeek={() => {}}
        onEnded={() => {}}
        API_BASE=""
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  // Test 4: Calls callbacks
  test('calls onPlayPause when button is clicked', () => {
    const handlePlayPause = jest.fn();

    render(
      <BottomPlayerBar
        track={mockTrack}
        playing={false}
        onPlayPause={handlePlayPause}
        onSeek={() => {}}
        onEnded={() => {}}
        API_BASE=""
      />,
    );

    screen.getByLabelText('play').click();
    expect(handlePlayPause).toHaveBeenCalledTimes(1);
  });

  // Test 5: Displays correct duration formatting
  test('displays formatted duration when duration is available', () => {
    // Create a mock track with a known duration
    const trackWithDuration = {
      ...mockTrack,
      id3: {
        ...mockTrack.id3,
        duration: 185, // 3:05
      },
    };

    render(
      <BottomPlayerBar
        track={trackWithDuration}
        playing={false}
        onPlayPause={() => {}}
        onSeek={() => {}}
        onEnded={() => {}}
        API_BASE=""
      />,
    );

    // Force the duration to appear in tests
    const audio = document.querySelector('audio');
    if (audio) {
      Object.defineProperty(audio, 'duration', { value: 185 });
      const event = new Event('loadedmetadata');
      audio.dispatchEvent(event);
    }

    // Look for the duration text
    const durationText = screen.queryByText('0:00 / 3:05');
    expect(durationText).not.toBeNull();
  });
});
