// Define an interface extending the global Window interface
interface WindowWithApiBase extends Window {
  __MIXTAPE_API_BASE__?: string; // Make the property optional
}

// Remove hardcoded API_BASE
export function getApiBase(): string {
  // Try window.__MIXTAPE_API_BASE__ if set by server, else env, else default
  // Cast window to the specific interface instead of any
  if (typeof window !== 'undefined' && (window as WindowWithApiBase).__MIXTAPE_API_BASE__) {
    return (window as WindowWithApiBase).__MIXTAPE_API_BASE__!; // Use non-null assertion as we checked it exists
  }
  // CRA env var
  if (process.env.REACT_APP_API_BASE) {
    return process.env.REACT_APP_API_BASE;
  }
  return 'http://localhost:4000';
}
