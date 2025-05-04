import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Update the test description and the text being searched for
test('renders Mixtape title in header', () => {
  render(<App />);
  // Look for the text "Mixtape" (case-insensitive) within a heading element
  const titleElement = screen.getByRole('heading', { name: /Mixtape/i });
  expect(titleElement).toBeInTheDocument();
});
