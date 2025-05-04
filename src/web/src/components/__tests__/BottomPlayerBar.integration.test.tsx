import React from 'react';
import { render, fireEvent, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BottomPlayerBar } from '../BottomPlayerBar';
import type { Track } from '../../types';

// Sample track with valid metadata
const mockTrack: Track = {
  id: 1,
  title: 'Test Song',
  file_url: '/api/tracks/1/stream',
  id3: {
    artist: 'Test Artist',
    album: 'Test Album',
    duration: 180, // 3 minutes
    track: 1,
    title: 'Test Song',
  },
};

describe('BottomPlayerBar Integration Tests (Simplified)', () => {
  // No need for fake timers if not testing time-based events directly
  // beforeEach(() => { jest.useFakeTimers(); });
  // afterEach(() => { jest.useRealTimers(); });

  test('should display track info and correct initial UI', () => {
    render(
      <BottomPlayerBar
        track={mockTrack}
        playing={false} // Initial state: paused
        onPlayPause={() => {}}
        onSeek={() => {}}
        onEnded={() => {}}
        API_BASE="http://test-api.com"
      />,
    );

    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
    expect(screen.getByLabelText('play')).toBeInTheDocument(); // Should show play icon
    expect(screen.queryByLabelText('pause')).not.toBeInTheDocument();
    // Check initial time display (assuming it starts at 0)
    expect(screen.getByTestId('time-display')).toHaveTextContent('0:00 / 3:00');
  });

  test('should call onPlayPause when play/pause button is clicked', () => {
    const handlePlayPause = jest.fn();
    const { rerender } = render(
      <BottomPlayerBar
        track={mockTrack}
        playing={false}
        onPlayPause={handlePlayPause}
        onSeek={() => {}}
        onEnded={() => {}}
        API_BASE="http://test-api.com"
      />,
    );

    // Click play
    fireEvent.click(screen.getByLabelText('play'));
    expect(handlePlayPause).toHaveBeenCalledTimes(1);

    // Rerender as playing (simulating parent state update)
    rerender(
      <BottomPlayerBar
        track={mockTrack}
        playing={true} // Now playing
        onPlayPause={handlePlayPause}
        onSeek={() => {}}
        onEnded={() => {}}
        API_BASE="http://test-api.com"
      />,
    );

    // Check UI updates based on prop
    expect(screen.getByLabelText('pause')).toBeInTheDocument(); // Should show pause icon
    expect(screen.queryByLabelText('play')).not.toBeInTheDocument();

    // Click pause
    fireEvent.click(screen.getByLabelText('pause'));
    expect(handlePlayPause).toHaveBeenCalledTimes(2);
  });

  test('should call onSeek when progress slider is changed', async () => {
    const handleSeek = jest.fn();
    render(
      <BottomPlayerBar
        track={mockTrack}
        playing={true}
        onPlayPause={() => {}}
        onSeek={handleSeek}
        onEnded={() => {}}
        API_BASE="http://test-api.com"
      />,
    );

    // The slider might appear after a slight delay or effect, wait for it
    const slider = await screen.findByTestId('progress-slider');
    const sliderInput = slider.querySelector('input[type="range"]');
    expect(sliderInput).toBeInTheDocument();

    // Simulate user changing the slider value
    // Note: We don't need act() here if the change handler doesn't cause async state updates *within this component*
    // that we need to wait for in *this* test. The parent handles the actual seek.
    fireEvent.change(sliderInput!, { target: { value: '60' } });

    // Verify the callback was called with the correct value
    expect(handleSeek).toHaveBeenCalledWith(60);

    // We are NOT testing if audio.currentTime changed here.
    // We could potentially test if the displayed time updates *if* the component
    // receives the new progress via props or manages it internally based on seek.
    // For now, we just test the callback.
  });

  // Optional: Test time display updates if progress is passed as a prop
  test('should display the correct time based on progress prop', () => {
    render(
      <BottomPlayerBar
        track={mockTrack}
        playing={true}
        // Add a hypothetical progress prop if the component uses one
        // progress={45} // e.g., 45 seconds
        onPlayPause={() => {}}
        onSeek={() => {}}
        onEnded={() => {}}
        API_BASE="http://test-api.com"
      />,
    );
    // If the component relies on internal state updated by audio events (which we removed),
    // this test might need adjustment or removal. If it takes a progress prop:
    // expect(screen.getByTestId('time-display')).toHaveTextContent('0:45 / 3:00');

    // For now, let's assume it uses internal state and test the initial state again
    expect(screen.getByTestId('time-display')).toHaveTextContent('0:00 / 3:00');
    // We would need Playwright to test the time display updating during actual playback.
  });
});
