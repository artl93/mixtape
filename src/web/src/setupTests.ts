// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Add minimal mocks for HTMLMediaElement methods called by the component
// to prevent "Not implemented" errors in jsdom.
// We don't need full simulation logic for the simplified tests.
Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: jest.fn().mockResolvedValue(undefined), // Return a resolved promise
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  value: jest.fn(), // Simple mock function
});

// Optional: Mock 'load' if the component calls it directly, otherwise not needed
// Object.defineProperty(window.HTMLMediaElement.prototype, 'load', {
//   configurable: true,
//   value: jest.fn(),
// });

// Clear mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
