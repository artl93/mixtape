// test-utils.ts - Helper functions for testing
import { render as rtlRender } from '@testing-library/react';
import { act } from '@testing-library/react';

// Helper to flush all pending effects and updates
export async function flushEffects() {
  // Allow effects to resolve
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

// Enhanced render that handles async effects
export async function render(ui: React.ReactElement) {
  let result;
  await act(async () => {
    result = rtlRender(ui);
    await flushEffects();
  });
  return result!;
}

// Helper to update state with proper act wrapping
export async function updateState(callback: () => void | Promise<void>) {
  await act(async () => {
    await callback();
    await flushEffects();
  });
}
