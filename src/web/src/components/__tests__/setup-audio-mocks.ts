// setup-audio-mocks.ts - Shared audio mocking for tests
import { act } from '@testing-library/react';

export function setupAudioMocks() {
  // Store original createElement to restore later
  const originalCreateElement = document.createElement.bind(document);

  // Create mock audio implementation
  const createMockAudio = () => {
    const audio = originalCreateElement('audio');

    // Internal state
    let currentTime = 0;
    let isPaused = true;
    let duration = 180;

    // Create a proxy to intercept property access
    const proxy = new Proxy(audio, {
      get(target, prop) {
        switch (prop) {
          case 'currentTime':
            return currentTime;
          case 'duration':
            return duration;
          case 'paused':
            return isPaused;
          case 'addEventListener':
            return target.addEventListener.bind(target);
          case 'removeEventListener':
            return target.removeEventListener.bind(target);
          case 'dispatchEvent':
            return target.dispatchEvent.bind(target);
          default:
            return target[prop as keyof HTMLAudioElement];
        }
      },
      set(target, prop, value) {
        switch (prop) {
          case 'currentTime':
            currentTime = value;
            proxy.dispatchEvent(new Event('timeupdate'));
            return true;
          case 'duration':
            duration = value;
            proxy.dispatchEvent(new Event('durationchange'));
            return true;
          default:
            return Reflect.set(target, prop, value);
        }
      },
    });

    // Mock methods
    const mockPlay = jest.fn().mockImplementation(async () => {
      isPaused = false;
      proxy.dispatchEvent(new Event('play'));
      return Promise.resolve();
    });

    const mockPause = jest.fn().mockImplementation(() => {
      isPaused = true;
      proxy.dispatchEvent(new Event('pause'));
    });

    Object.defineProperties(proxy, {
      play: { value: mockPlay },
      pause: { value: mockPause },
    });

    proxy.load = jest.fn();

    return proxy;
  };

  // Mock createElement
  jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
    if (tagName === 'audio') {
      return createMockAudio();
    }
    return originalCreateElement(tagName);
  });

  return {
    cleanup: () => {
      jest.restoreAllMocks();
    },
  };
}
